# Design QA — compact feed post (Option 1)

## Evidence

- Source visual truth: `/Users/sumangaldey/.codex/generated_images/01a18875-2157-7821-ac6a-b4cf31713df4/exec-5ac94d8f-3def-4ae0-95eb-9bc6d2362562.png`
- Implementation: `http://127.0.0.1:4180/`
- Browser-rendered implementation capture: Codex in-app browser tab 2, final collapsed feed state captured during verification on 2026-11-05 (`cua://iab/tab-2/cartel-option-1-final`)
- Viewport: 950 × 1056 CSS px, desktop feed layout
- Source pixels: 1141 × 1383
- Implementation capture pixels: 950 × 1056
- Density normalization: both reviewed at their native 1× browser/image density; comparison focused on the post component rather than matching the source's isolated-card canvas.
- State: post copy collapsed to four lines with inline bold `… Show more`; single portrait image contained in a 420 px media stage; lime `Open full image` action visible.

## Full-view comparison

The implementation preserves the existing three-column Cartel shell while reproducing the selected compact stacked card: tight author block, four-line text preview, contained portrait media, top-right lime full-image action, and a thin engagement row. The feed card now consumes substantially less vertical space than the original natural-aspect portrait rendering.

## Focused-region comparison

The post region was inspected at readable scale because fidelity depends on truncation, media containment, CTA color, and action-row placement. Typography remains the product's existing body font and weights rather than copying the generated mock's larger isolated-card scale. The source media is used directly, remains uncropped, and is centered with `object-fit: contain`.

## Required fidelity surfaces

- Fonts and typography: Existing Cartel font tokens are retained. Author hierarchy, metadata, four-line body rhythm, and black bold inline expansion action are consistent with the live product.
- Spacing and layout rhythm: Desktop body inset was removed, post top/copy spacing tightened, media bounded to 420 px, and the engagement row now follows media without the previous oversized gap.
- Colors and visual tokens: Off-white, white, black, border, and lime use existing CSS tokens. The media CTA uses `--accent`.
- Image quality and asset fidelity: The original Cloudinary asset is rendered directly with containment, without cropping, stretching, placeholder art, or regenerated imagery. The full-resolution image is available in the overlay.
- Copy and content: Existing author, timestamp, post body, counts, and action labels are preserved. `Open full image`, `Show more`, and `Show less` are explicit and accessible.

## Interaction and accessibility verification

- `Open full image` opened the modal with keyboard activation.
- The modal exposed `role="dialog"`, `aria-modal="true"`, an accessible label, and a labelled close button.
- Escape closed the modal.
- Background scrolling is locked while the modal is open and restored when closed.
- The compact `Show more` / `Show less` flow still works.
- Browser console: no runtime errors; one non-blocking Next.js LCP optimization warning for the remote feed image.
- Production build: passed (`next build`, including TypeScript and static generation).

## Comparison history

### Pass 1

- [P2] The full-image CTA was transparent because its CSS referenced an undefined `--lime` token.
- Fix: changed the CTA background to the established `--accent` token.
- Post-fix evidence: final browser capture shows the lime CTA, centered contained media, compact copy, and unchanged square-edged product language.

### Pass 2

- No actionable P0, P1, or P2 differences remained.

## Follow-up polish

- [P3] Consider marking only the first above-the-fold feed image as eager to remove Next.js's development-only LCP warning without eagerly loading every post image.

## Final result

final result: passed
