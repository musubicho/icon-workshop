# Icon guidelines

Drawing rules for Nyatabi icons. Read this before drawing a new icon or changing an old one. Before submitting, walk through "Self-check" item by item.

## Canvas and strokes

- Canvas is `viewBox="0 0 48 48"`. The app displays icons at 24pt, so stroke width and spacing are halved.
- Write the root element like this:

  ```svg
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="#453D35" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" data-category="Food">
    <title>Ramen</title>
    <desc>Optional. One sentence describing the drawing.</desc>
  ```

- Stroke width is only 2.4. Do not make it thicker or thinner.
- Caps and joins are round. When measuring spacing, a round cap extends the stroke end by 1.2.
- Use only `path`, `circle`, `ellipse`, `rect`, `line`, `polyline`, `polygon`, and `g`. Do not write `style`, CSS, filters, or external references (`validate.ts` rejects them).
- `data-category` and `<title>` are the collection and display name. Match the value already used by other icons in that collection.

## Color

| Role | Light | Dark (replaced automatically on export) | Use |
| --- | --- | --- | --- |
| Ink | `#453D35` | `#EFE4D7` | Main outline, written on the root element |
| Vermilion | `#C23B22` | `#FF7A5C` | Primary accent: one key detail |
| Gold | `#8A6200` | `#E0A526` | Secondary accent: decoration, ticks, steam |
| Matcha | `#53765A` | `#9FBC91` | Plants, tea, and success states only |

- Outlines use ink. Color is for details only, except when the whole icon is a status color, such as `done` and `failed`.
- A light fill uses the same color, with `fill-opacity` between `.12` and `.16`, and `stroke="none"` or a stroke of the same color.
- Solid fills are only for dots with a diameter of 5 or less, such as eyes or the pivot of a hand.

## Spacing

Monochrome mode (`currentColor`, iOS template images) turns every color into one color. Strokes that still read in full color become a blob in monochrome. The rules below take priority over looks.

1. **A colored stroke never touches an ink stroke. No exceptions.** Do not stack it on ink, cross ink, or land an endpoint on ink. A part attached to an object (handle, roof light, pin, base) is either the same color as the object and joined to it, or a different color with a gap.
2. **Two strokes that are not joined stay at least 3.6 apart, center to center.** The visible gap is at least 1.2 (0.6pt at 24pt). Same color or different color, endpoints included.
   - Distance from a stroke end to a straight stroke is measured center to center. The round cap is already inside this 3.6.
   - Distance from a stroke end to a circle or arc = distance from the endpoint to the center, minus the radius. That must also be at least 3.6.
3. **Occluded objects break.** A person behind, a sheet behind, a radish in a basket: stop the stroke 3.6 before the outline in front. Do not join it to that outline.
4. **Crossings show which stroke is in front.** When two strokes must intersect (chain links, a delete slash), break the lower stroke on both sides of the crossing. The gap stays at least 3.6 from the upper stroke's centerline. Colored parts a slash passes through break the same way.
5. **If it does not fit, leave it out.** A stroke inside an outline needs 3.6 on each side, so the inner width is at least 7.2. Narrow spots such as a wing or a bottle neck cannot hold it. Remove the stroke or move it outside the outline.
6. Structural strokes of the same color inside the same object may join, such as a calendar header or the graticule of a globe.
7. Light fills are not limited by spacing, but they must stay inside their outline.

## Shape

- **An arrow is one color for its whole length.** Head and shaft are both ink, or both colored. The two barbs sit symmetrically on either side of the tangent at the end of the shaft. On a curved arrow, a head that is exactly on the tangent looks like it points into the curve, so turn it around its tip, away from the arc's center. Tune the angle by eye for each arrow; tighter curves need more (`later` 10.5°, `refresh` 13.5°, `subscription` 23.5°, `backup` 24.5°). Recheck barb spacing after turning.
- **Silhouette corners are rounded.** Where a curve meets a flat base, such as a shoulder, a plate, or a stand, close it with `q` at a radius of about 2. Do not meet at a right angle. Stars, gears, checks, and crosses keep their points.
- **Interior detail sits on the visual center.** Rules and marks inside a card, tag, or badge are centered on the area left after holes and straps are removed. Do not push them into a corner.
- When a badge sits on the subject (a plus on a calendar, a top-up on a card), break the subject's outline around the badge, as in rule 4.

## Common mistakes

| Mistake | Example (fixed) | Fix |
| --- | --- | --- |
| Endpoints of a colored radius land on the circumference | `stats` | Pull each end in by 3.6 |
| A colored shape crosses an ink edge | `wallet`, `other` | Break the ink stroke where it is crossed |
| Tick marks ride the dial arc | `usage` | Pull the ticks inside the arc |
| Two rings stacked directly | `link` | Break the ink in one place and the vermilion in another, so they link |
| A colored handle or roof light stands on an ink stroke | `trash`, `taxi`, `guest` | Handle matches the lid and separates from the body; light floats; clasp is ink |
| The person behind joins the person in front | `nearby` | Stop the rear figure before the front outline |
| Shoulder and baseline meet at a right angle | `nearby`, `profile`, `invite` | Round the corner |
| Arrow head and shaft differ in color, and the head misses the arc | `refresh`, `undo` | One color for the whole arrow; head follows the tangent |
| A stroke end is less than 1 from the frame | `filter`, `passport`, `train` | Shorten it to 3.6 |
| A colored stroke forced into a narrow band | `plane` | Remove it, or move it outside the outline |
| A rule sits in the corner of a label | `other` | Move it to the visual center of the label's area |

## Self-check

1. On the site, switch to **Monochrome** and look for anything that has merged into a blob.
2. Switch the preview to **24 px** and look for strokes that touch.
3. Against "Spacing" and "Shape", check both endpoints of every colored element, every corner, and every arrow.
4. Export the full set into the app. See "Use on iOS" in the README. `MusubiIcons.xcassets` is exported from here only. Do not edit it by hand in the app repository.
