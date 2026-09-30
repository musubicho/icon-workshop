const $ = (selector) => document.querySelector(selector);
const state = { icons: [], palette: {}, selected: null, category: "全部", mode: "duo", theme: "light", valid: true };
const urls = new WeakMap();
let previewTimer, toastTimer;
const dirty = () => state.selected && $("#source").value !== state.selected.svg;

function notify(message) {
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $("#toast").hidden = true; }, 6000);
}

async function request(url, options) {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "请求失败，请重试。");
  return body;
}

function svgDocument(source) {
  const doc = new DOMParser().parseFromString(source, "image/svg+xml");
  if (doc.querySelector("parsererror") || doc.documentElement.localName !== "svg") throw new Error("SVG 语法有误，请检查源稿。");
  return doc;
}

function renderSvg(source) {
  const doc = svgDocument(source);
  const palette = Object.values(state.palette);
  const theme = state.theme === "dark" ? 1 : 0;
  const ink = state.palette.ink[theme];
  for (const node of doc.querySelectorAll("*")) {
    for (const attr of ["fill", "stroke"]) {
      const color = node.getAttribute(attr);
      if (!color || ["none", "transparent"].includes(color.toLowerCase())) continue;
      const pair = palette.find((pair) => pair.some((value) => value.toLowerCase() === color.toLowerCase()));
      node.setAttribute(attr, state.mode === "mono" ? ink : (pair?.[theme] || color));
    }
  }
  return new XMLSerializer().serializeToString(doc);
}

function setImage(img, source) {
  const rendered = renderSvg(source);
  const old = urls.get(img);
  if (old) URL.revokeObjectURL(old);
  const url = URL.createObjectURL(new Blob([rendered], { type: "image/svg+xml" }));
  urls.set(img, url);
  img.src = url;
}

function releaseImages(container) {
  container.querySelectorAll("img").forEach((img) => { const url = urls.get(img); if (url) URL.revokeObjectURL(url); });
}

function renderCategories() {
  const nav = $("#categories");
  nav.replaceChildren();
  const available = [...new Set(state.icons.map((icon) => icon.category))];
  const categories = ["全部", ...["账本", "饮食", "旅途", "结与印"].filter((name) => available.includes(name)), ...available.filter((name) => !["账本", "饮食", "旅途", "结与印"].includes(name))];
  for (const category of categories) {
    const button = document.createElement("button");
    button.className = "category";
    button.setAttribute("aria-pressed", category === state.category);
    button.append(category === "全部" ? "全部图标" : category);
    const count = document.createElement("span");
    count.textContent = String(category === "全部" ? state.icons.length : state.icons.filter((icon) => icon.category === category).length).padStart(2, "0");
    button.append(count);
    button.onclick = () => { state.category = category; renderCategories(); renderGrid(); };
    nav.append(button);
  }
}

function renderGrid() {
  const grid = $("#grid");
  releaseImages(grid);
  grid.replaceChildren();
  const query = $("#search").value.trim().toLowerCase();
  const icons = state.icons.filter((icon) => (state.category === "全部" || icon.category === state.category) && `${icon.name} ${icon.id} ${icon.category}`.toLowerCase().includes(query));
  $("#shelf-title").textContent = state.category === "全部" ? "全部图标" : state.category;
  $("#shelf-count").textContent = `${String(icons.length).padStart(2, "0")} / ${String(state.icons.length).padStart(2, "0")} ICONS`;
  $("#empty").hidden = icons.length > 0;
  for (const icon of icons) {
    const button = document.createElement("button");
    button.className = "icon-card";
    button.setAttribute("aria-pressed", icon.id === state.selected?.id);
    button.setAttribute("aria-label", `编辑${icon.name}`);
    const number = document.createElement("span");
    number.className = "number";
    number.textContent = String(state.icons.indexOf(icon) + 1).padStart(2, "0");
    const img = document.createElement("img");
    img.alt = "";
    try { setImage(img, icon.svg); } catch { img.alt = "源稿待修复"; }
    const name = document.createElement("strong");
    name.textContent = icon.name;
    button.append(number, img, name);
    button.onclick = () => selectIcon(icon);
    grid.append(button);
  }
}

function selectIcon(icon) {
  if (icon.id === state.selected?.id) return;
  if (dirty() && !confirm("当前源稿尚未保存。要放弃这次编辑并切换图标吗？")) return;
  state.selected = icon;
  $("#icon-name").textContent = icon.name;
  $("#icon-id").textContent = icon.id;
  $("#source").value = icon.svg;
  $("#context-name").textContent = ({ ramen: "一碗热乎的拉面", matcha: "街角的一杯抹茶", train: "坐电车去下一站", plane: "出发，去新的地方", lodging: "今晚住在这里", gift: "带一份小小的手信" })[icon.id] || `${icon.name} · 一笔日常`;
  renderGrid();
  updatePreview();
}

function updatePreview() {
  const source = $("#source").value;
  $("#save-state").textContent = dirty() ? "● 尚未保存" : "已保存";
  $("#save-state").classList.toggle("dirty", !!dirty());
  $("#line-count").textContent = `${source.split("\n").length} LINES`;
  try {
    setImage($("#hero-icon"), source);
    setImage($("#context-icon"), source);
    const strip = $("#size-strip");
    releaseImages(strip);
    strip.replaceChildren();
    for (const size of [16, 20, 24, 32, 48]) {
      const cell = document.createElement("div");
      const img = document.createElement("img");
      img.width = size; img.height = size; img.alt = `${size} 像素预览`;
      setImage(img, source);
      const label = document.createElement("span");
      label.textContent = String(size);
      cell.append(img, label); strip.append(cell);
    }
    state.valid = true;
    $("#editor-note").textContent = "修改路径、线条或颜色，预览会随之更新。";
    $("#editor-note").classList.remove("error");
  } catch (error) {
    state.valid = false;
    $("#editor-note").textContent = `${error.message} 暂时保留上次有效预览。`;
    $("#editor-note").classList.add("error");
  }
  $("#save").disabled = !dirty() || !state.valid;
  $("#download").disabled = !state.valid;
  $("#export-ios").disabled = !!dirty();
}

async function save() {
  if (!dirty() || !state.valid) return;
  const selected = state.selected;
  const submitted = $("#source").value;
  $("#save").disabled = true;
  try {
    const icon = await request(`/api/icons/${selected.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ svg: submitted, base: selected.svg }) });
    Object.assign(selected, icon);
    if (state.selected.id === selected.id) { $("#icon-name").textContent = icon.name; updatePreview(); }
    renderCategories(); renderGrid();
    notify("源稿已保存到本地图标文件。");
  } catch (error) { notify(error.message); updatePreview(); }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$("#source").addEventListener("input", () => {
  clearTimeout(previewTimer);
  $("#save-state").textContent = "● 尚未保存";
  $("#export-ios").disabled = true;
  previewTimer = setTimeout(updatePreview, 180);
});
$("#source").addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  event.preventDefault();
  const input = event.currentTarget;
  input.setRangeText("  ", input.selectionStart, input.selectionEnd, "end");
  input.dispatchEvent(new Event("input"));
});
$("#search").addEventListener("input", renderGrid);
$("#save").onclick = save;
$("#download").onclick = () => downloadBlob(new Blob([renderSvg($("#source").value)], { type: "image/svg+xml" }), `${state.selected.id}-${state.mode}-${state.theme}.svg`);
$("#export-ios").onclick = async () => {
  $("#export-ios").disabled = true;
  try {
    const response = await fetch(`/api/export-ios?mode=${state.mode}`);
    if (!response.ok) throw new Error((await response.json()).error);
    downloadBlob(await response.blob(), `MusubiIcons-${state.mode}.zip`);
    notify(`已导出 ${state.icons.length} 枚${state.mode === "mono" ? "单色" : "原色"}图标，可拖入 Xcode 使用。`);
  } catch (error) { notify(error.message); }
  finally { $("#export-ios").disabled = !!dirty(); }
};
document.querySelectorAll("[data-mode]").forEach((button) => {
  button.onclick = () => {
    state.mode = button.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach((item) => item.setAttribute("aria-pressed", item === button));
    renderGrid(); updatePreview();
  };
});
$("#theme").onclick = () => {
  state.theme = state.theme === "light" ? "dark" : "light";
  document.body.dataset.theme = state.theme;
  $("#theme").setAttribute("aria-pressed", state.theme === "dark");
  $("#theme").setAttribute("aria-label", state.theme === "dark" ? "切换浅色预览" : "切换深色预览");
  renderGrid(); updatePreview();
};
$("#new-icon").onclick = () => { $("#create-error").textContent = ""; $("#create-dialog").showModal(); };
$("#cancel-create").onclick = () => $("#create-dialog").close();
$("#create-form").onsubmit = async (event) => {
  event.preventDefault();
  const formElement = event.currentTarget;
  if (dirty() && !confirm("当前源稿尚未保存。要放弃这次编辑并开始新的图标吗？")) return;
  const form = new FormData(formElement);
  const escape = (text) => text.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]);
  const source = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="#453D35" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" data-category="${escape(form.get("category"))}">\n  <title>${escape(form.get("name"))}</title>\n  <rect x="12" y="12" width="24" height="24" rx="6"/>\n</svg>\n`;
  try {
    const icon = await request(`/api/icons/${form.get("id")}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ svg: source, base: null }) });
    state.icons.push(icon); state.selected = null;
    state.category = "全部"; $("#search").value = "";
    $("#create-dialog").close(); formElement.reset();
    renderCategories(); selectIcon(icon); $("#source").focus(); notify("新源稿已创建，从这枚形状开始画吧。");
  } catch (error) { $("#create-error").textContent = error.message; }
};
window.addEventListener("beforeunload", (event) => { if (dirty()) { event.preventDefault(); event.returnValue = ""; } });
document.addEventListener("keydown", (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") { event.preventDefault(); save(); } });

try {
  const data = await request("/api/icons");
  state.icons = data.icons; state.palette = data.palette;
  renderCategories();
  if (state.icons.length) selectIcon(state.icons.find((icon) => icon.id === "ramen") || state.icons[0]);
  else { renderGrid(); $("#new-icon").click(); }
} catch (error) { $("#shelf-count").textContent = "工坊未能打开"; notify(error.message); }
