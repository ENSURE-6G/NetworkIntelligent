# Source Analysis

## High-level structure

The source HTML is a self-contained front-end demonstrator with:

- one `<canvas>` used for all animated map rendering
- one overlay UI for the story stages
- inline CSS only
- inline JavaScript only

## Major behaviors

1. Presenter flow across seven stages:
   - mission
   - sensing
   - fusion
   - constraint
   - transfer
   - decision
   - outcome

2. Interaction state:
   - current stage
   - autoplay on/off
   - season selection
   - network condition selection
   - trust/action output state

3. Rendering model:
   - custom Sweden geometry
   - custom route interpolation
   - custom train animation
   - repeated `requestAnimationFrame` draw loop

## Conversion approach

This conversion intentionally does not rewrite the canvas engine into native Streamlit visuals.

Reasons:

- The source is already an application, not just a document.
- The JavaScript rendering loop is the most valuable and most expensive part to recreate.
- Streamlit is best used here as the hosting shell, runner, and packaging surface.
- This keeps the result maintainable while preserving the original behavior.

## Refactor result

The source is now split inside `assets/refactored/` into:

- `index.html`
- `css/`
- `body/`
- `js/data/`
- `js/demo-data/`
- `js/demo-state/`
- `js/map-core/`
- `js/map-data/`
- `js/map-renderer/`

The Streamlit loader recomposes those files into one inline HTML payload at runtime so the iframe keeps working without introducing an external frontend build step.
