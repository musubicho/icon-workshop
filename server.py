"""A local SVG workbench. Python standard library only."""
import argparse
import io
import json
import math
import os
from pathlib import Path
import re
import shutil
import tempfile
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parent
ICON_DIR = ROOT / "icons"
NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", NS)
PALETTE = {
    "ink": ["#453D35", "#EFE4D7"],
    "accent": ["#C23B22", "#FF7A5C"],
    "gold": ["#8A6200", "#E0A526"],
    "green": ["#53765A", "#9FBC91"],
}


def validate(source):
    if not isinstance(source, str) or len(source.encode()) > 256_000:
        raise ValueError("SVG 不能为空，且不能超过 256 KB。")
    if re.search(r"<!\s*(DOCTYPE|ENTITY)", source, re.IGNORECASE):
        raise ValueError("请移除 DTD 或实体声明，使用纯矢量 SVG。")
    try:
        root = ET.fromstring(source)
    except ET.ParseError as error:
        raise ValueError(f"SVG 格式有误：{error}") from error
    if root.tag != f"{{{NS}}}svg":
        raise ValueError("需要带 xmlns 的 SVG 根元素。")
    try:
        box = [float(n) for n in root.attrib["viewBox"].replace(",", " ").split()]
        if len(box) != 4 or not all(math.isfinite(n) for n in box) or min(box[2:]) <= 0:
            raise ValueError()
    except (KeyError, ValueError):
        raise ValueError("需要有效的 viewBox，例如 0 0 48 48。") from None
    for node in root.iter():
        if node.tag not in {f"{{{NS}}}{tag}" for tag in (
            "svg", "g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon", "title", "desc"
        )}:
            raise ValueError("第一版支持路径与基本形状；请将文字、效果或嵌入图片转换为矢量路径。")
        for key, value in node.attrib.items():
            if key.lower().startswith("on") or "href" in key.lower() or key == "style" or "url(" in value.lower():
                raise ValueError("请使用直接的 fill / stroke 属性，不使用脚本、外部引用或 CSS。")
    return root


def icon_info(path):
    source = path.read_text()
    try:
        root = ET.fromstring(source)
        name = root.findtext(f"{{{NS}}}title") or path.stem
        category = root.get("data-category", "其他")
    except ET.ParseError:
        name, category = path.stem, "其他"
    return {"id": path.stem, "name": name, "category": category, "svg": source}


def render_svg(source, mode="duo", theme="light"):
    root = validate(source)
    ink = PALETTE["ink"][theme == "dark"]
    colors = {color.lower(): pair[theme == "dark"] for pair in PALETTE.values() for color in pair}
    for node in root.iter():
        for key, value in list(node.attrib.items()):
            if key.startswith("data-"):
                del node.attrib[key]
            elif key in ("fill", "stroke") and value.lower() not in ("none", "transparent"):
                node.set(key, ink if mode == "mono" else colors.get(value.lower(), value))
    return ET.tostring(root, encoding="unicode")


def save_icon(slug, source, base):
    if not re.fullmatch(r"[a-z][a-z0-9-]{0,63}", slug):
        raise ValueError("名称需以小写字母开头，仅含小写字母、数字和短横线，最多 64 个字符。")
    validate(source)
    path = ICON_DIR / f"{slug}.svg"
    if path.exists() and path.read_text() != base:
        raise FileExistsError("源文件已在别处修改，或名称已存在。请保留当前代码，刷新后合并。")
    if not path.exists() and base is not None:
        raise FileExistsError("源文件已在别处移走。请保留当前代码，刷新后检查。")
    with tempfile.NamedTemporaryFile(mode="w", dir=ICON_DIR, suffix=".tmp", delete=False) as temp:
        temp.write(source)
    try:
        os.replace(temp.name, path)
    finally:
        Path(temp.name).unlink(missing_ok=True)
    return icon_info(path)


def export_ios(mode):
    output = io.BytesIO()
    info = {"info": {"author": "xcode", "version": 1}}
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("MusubiIcons.xcassets/Contents.json", json.dumps(info))
        for path in sorted(ICON_DIR.glob("*.svg")):
            prefix = f"MusubiIcons.xcassets/musubi-{path.stem}.imageset/"
            root = validate(path.read_text())
            root.set("width", "24")
            root.set("height", "24")
            source = ET.tostring(root, encoding="unicode")
            images = [{"filename": "light.svg", "idiom": "universal"}]
            archive.writestr(prefix + "light.svg", render_svg(source, mode))
            if mode == "duo":
                images.append({"filename": "dark.svg", "idiom": "universal", "appearances": [{"appearance": "luminosity", "value": "dark"}]})
                archive.writestr(prefix + "dark.svg", render_svg(source, mode, "dark"))
            contents = {**info, "images": images, "properties": {
                "preserves-vector-representation": True,
                "template-rendering-intent": "template" if mode == "mono" else "original",
            }}
            archive.writestr(prefix + "Contents.json", json.dumps(contents, indent=2))
    return output.getvalue()


def build_site(out):
    out = Path(out)
    shutil.rmtree(out, ignore_errors=True)
    shutil.copytree(ROOT / "web", out)
    (out / "api").mkdir()
    icons = [icon_info(path) for path in sorted(ICON_DIR.glob("*.svg"))]
    (out / "api" / "icons").write_text(json.dumps({"icons": icons, "palette": PALETTE, "readonly": True}, ensure_ascii=False))
    for mode in ("duo", "mono"):
        (out / "api" / f"MusubiIcons-{mode}.zip").write_bytes(export_ios(mode))
    (out / ".nojekyll").touch()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / "web"), **kwargs)

    def local_request(self):
        allowed = {f"{host}:{self.server.server_port}" for host in ("127.0.0.1", "localhost")}
        host = self.headers.get("Host")
        return host in allowed and self.headers.get("Origin", f"http://{host}") == f"http://{host}"

    def reply(self, body, status=200, content_type="application/json; charset=utf-8", filename=None):
        data = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        if filename:
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if not self.local_request():
            return self.reply({"error": "只接受本地同源请求。"}, 403)
        route = urlsplit(self.path)
        try:
            if route.path == "/api/icons":
                return self.reply({"icons": [icon_info(path) for path in sorted(ICON_DIR.glob("*.svg"))], "palette": PALETTE})
            if export := re.fullmatch(r"/api/MusubiIcons-(duo|mono)\.zip", route.path):
                mode = export.group(1)
                return self.reply(export_ios(mode), content_type="application/zip", filename=f"MusubiIcons-{mode}.zip")
            return super().do_GET()
        except ValueError as error:
            self.reply({"error": str(error)}, 400)
        except OSError as error:
            self.reply({"error": f"读取失败：{error}"}, 500)

    def do_POST(self):
        if not self.local_request():
            return self.reply({"error": "只接受本地同源请求。"}, 403)
        if not self.path.startswith("/api/icons/"):
            return self.reply({"error": "地址不存在。"}, 404)
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 300_000 or self.headers.get("Content-Type") != "application/json":
                raise ValueError("需要不超过 300 KB 的 JSON 请求。")
            body = json.loads(self.rfile.read(length))
            if not isinstance(body, dict):
                raise ValueError("需要包含 svg 和 base 的 JSON 对象。")
            self.reply(save_icon(self.path.removeprefix("/api/icons/"), body.get("svg"), body.get("base")))
        except FileExistsError as error:
            self.reply({"error": str(error)}, 409)
        except ValueError as error:
            self.reply({"error": str(error)}, 400)
        except OSError as error:
            self.reply({"error": f"保存失败：{error}"}, 500)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=4173)
    parser.add_argument("--build", metavar="DIR", help="write a read-only static copy to DIR instead of serving")
    args = parser.parse_args()
    if args.build:
        build_site(args.build)
        raise SystemExit
    with HTTPServer(("127.0.0.1", args.port), Handler) as server:
        print(f"图标工坊 → http://127.0.0.1:{server.server_port}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
