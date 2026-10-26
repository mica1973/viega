# Carousel block

Use a carousel for a small set of feature slides with an image, heading, short copy and one call to action per slide. The block is manually navigated; it does not autoplay.

## Authoring model

- Each direct row inside the Carousel block is one slide.
- Put one image in the first cell and slide content in the second cell.
- Use one heading (`h1` for the first slide, then `h2`) followed by optional paragraph(s) and a link.
- Slides can omit an image or content; the decorator handles missing cells.
- Keep the number of slides focused (the Viega homepage uses four).

The block adds previous/next buttons, numbered indicators, keyboard arrow navigation, reduced-motion-aware scrolling, and non-active slide focus management.

## Homepage mapping

`buildViegaHomepageCarousel` in `scripts/scripts.js` recognizes the current four-row Viega homepage teaser Cards block on the supported homepage paths and maps it to this Carousel before block decoration. It only applies when the page heading and row structure match, and does not alter DA source content. For future authoring, use an actual Carousel block in the DA document.
