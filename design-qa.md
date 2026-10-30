# Design QA — Home feed middle column

- Source visual truth: `http://127.0.0.1:4173/#` plus `/var/folders/6v/tsrf5q3s4zq75hqlgvpss3sc0000gn/T/TemporaryItems/NSIRD_screencaptureui_b6EvuZ/Screenshot 2026-10-30 at 5.30.42 PM.png` (user-supplied wide desktop reference)
- Implementation screenshot source: `http://127.0.0.1:4180/` (local Next.js preview, captured in the same in-app browser surface)
- Viewport: 1440 × 900 CSS pixels
- Source pixels: 1440 × 900
- Implementation pixels: 1440 × 900
- Density normalization: same browser surface, same CSS viewport, 1× comparison
- State: desktop, Home, “For you” selected, composer closed, first Reuters story visible
- Scope: middle feed column plus the reference search field at the top of the right rail; the remaining right-rail card content is outside this pass

## Full-view comparison evidence

The final matched capture confirms that the implementation and source use the same 730px center column, 108px feed masthead, 693px composer and market-pulse widths, content order, square surfaces, lime active state, and Reuters story layout. The first story begins in the same above-the-fold region and the Maya Noor post follows at the same density.

The right-rail search field matches the source at approximately 342 × 44 CSS pixels with a 24px rail inset and 17px gap before the first card.

## Focused region comparison evidence

Focused checks covered the feed masthead, tab placement, composer, five-cell market ticker, Reuters author row, story copy, market chip, 617px article preview, and engagement row. The source and implementation geometry now align within minor subpixel/browser-font variation. The ECB preview uses a real project image asset at the same crop and aspect ratio as the reference.

## Required fidelity surfaces

- Fonts and typography: Manrope/DM Sans hierarchy, weights, sizes, wrapping, and uppercase microcopy match the reference. Minor raster text weight variation is non-blocking.
- Spacing and layout rhythm: header, composer, ticker, story padding, preview, and action row align with the source. Square corners and border rhythm are preserved.
- Colors and tokens: near-black, off-white, muted gray, lime accent, positive green, negative red, and Reuters red map to the reference palette.
- Image quality and asset fidelity: `public/assets/ecb-market-grid.png` is a real raster asset with the correct subject, crop, aspect ratio, and palette. It is slightly bolder than the source artwork but remains a P3 refinement.
- Copy and content: feed labels, market data, Reuters copy, story headline, metadata, and Maya Noor post match the selected source.
- Icons and controls: one consistent icon library is used; visible actions have labels and focus states.
- Responsive behavior: desktop at 1440 × 900 and mobile at 390 × 844 were visually checked. The ticker scrolls horizontally on mobile and the article preview reflows to one column.
- Accessibility: semantic tabs expose selected state; interactive controls are buttons; the article image has alt text; focus-visible styles and reduced-motion handling are present.

## Interaction verification

- Feed tabs filter the Reuters story correctly.
- Composer opens, accepts text, publishes a new feed post, and closes.
- Reuters like and comment controls update their visible states.
- The right-rail search accepts and retains typed text.
- Desktop and mobile layouts render without overlap.
- Browser console warnings/errors checked: none.

## Comparison history

### Pass 1 — blocked

- P1: the implementation used a “Home / Your briefing” header instead of “Your feed” with date and right-aligned tabs.
- P1: the composer omitted Media, Link, and Market controls.
- P1: the market pulse and real news feed were absent.
- P1: the center column used an empty foundation state rather than Reuters and community posts.
- P2: the center grid track was wider than the selected reference.

### Fixes applied

- Rebuilt the middle column as an interactive client component.
- Matched the reference grid, masthead, composer, ticker, Reuters story, preview card, engagement row, and following Maya post.
- Added tab filtering, composer publishing, likes, saves, and comment expansion.
- Added the generated ECB raster story asset to the project.
- Matched ticker height and text positioning after the first rendered comparison.

### Pass 2 — passed

- Post-fix matched viewport comparison found no actionable P0, P1, or P2 differences in the middle-column scope.
- Remaining P3: the ECB letters are optically bolder than the source artwork.

### Pass 3 — passed

- Added the previously omitted right-rail search field.
- Matched its width, height, inset, icon, placeholder, border treatment, and keyboard focus state to the source.
- Verified native search input behavior and confirmed no browser console warnings or errors.

### Pass 4 — passed

- Initial interpretation removed the centered `1580px` maximum width and expanded the center track. The user clarified that the original UI proportions must remain unchanged, so this interpretation was superseded in Pass 5.

### Pass 5 — passed

- Restored the original `1580px` centered frame, automatic side margins, `730px` desktop feed track, and all existing responsive breakpoints.
- Removed only the two `1px` outer inline borders from `.app-frame`; inner column separators remain unchanged.
- Browser evidence confirms the frame keeps `max-width: 1580px`, has `0px` outer inline borders, renders without horizontal overflow, and preserves the existing responsive two-column state at 1095px.
- Fonts, colors, image assets, copy, column proportions, spacing, and interaction states remain unchanged.
- Build, lint, and browser console checks pass with no errors.

### Pass 6 — passed

- Recolored only the unused side space inside `.app-frame` from white (`--surface`) to the page background token (`--paper`, `rgb(245, 245, 239)`).
- Browser evidence confirms the frame, `html`, and `body` backgrounds now resolve to the identical color; the two side gutters therefore blend into the surrounding canvas.
- The centered `1580px` maximum width, grid tracks, column content backgrounds, spacing, typography, assets, copy, and responsive behavior remain unchanged.
- Browser-rendered implementation: `http://127.0.0.1:4180/`, checked at the active desktop viewport with zero horizontal overflow.
- Build, lint, and browser console checks pass with no errors.

## Final result

final result: passed
