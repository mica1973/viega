let carouselCount = 0;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function getSlides(block) {
  return [...block.querySelectorAll(':scope > .carousel-slides-container > .carousel-slides > .carousel-slide')];
}

function setActiveSlide(block, activeIndex) {
  const slides = getSlides(block);
  const indicators = [...block.querySelectorAll('.carousel-slide-indicator button')];
  const normalizedIndex = (activeIndex + slides.length) % slides.length;

  block.dataset.activeSlide = `${normalizedIndex}`;
  slides.forEach((slide, index) => {
    const active = index === normalizedIndex;
    slide.setAttribute('aria-hidden', `${!active}`);
    slide.inert = !active;
  });

  indicators.forEach((button, index) => {
    if (index === normalizedIndex) {
      button.setAttribute('aria-current', 'true');
      button.setAttribute('aria-pressed', 'true');
    } else {
      button.removeAttribute('aria-current');
      button.setAttribute('aria-pressed', 'false');
    }
  });
}

function showSlide(block, requestedIndex) {
  const slides = getSlides(block);
  if (slides.length < 2) return;

  const nextIndex = (requestedIndex + slides.length) % slides.length;
  const slide = slides[nextIndex];
  const track = block.querySelector('.carousel-slides');
  if (!slide || !track) return;

  setActiveSlide(block, nextIndex);
  track.scrollTo({
    top: 0,
    left: slide.offsetLeft,
    behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
  });
}

function createSlide(row, index, total, carouselId) {
  const slide = document.createElement('li');
  slide.className = 'carousel-slide';
  const destination = row.querySelector('a[href]')?.getAttribute('href') || '';
  if (destination.includes('/produkte/highlights.html')) slide.classList.add('carousel-slide-accent');
  slide.id = `${carouselId}-slide-${index + 1}`;
  slide.dataset.slideIndex = `${index}`;
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'Folie');
  slide.setAttribute('aria-label', `${index + 1} von ${total}`);

  const cells = [...row.children];
  const imageCell = cells.find((cell) => cell.querySelector('picture, img'));
  const contentCells = cells.filter((cell) => cell !== imageCell);

  if (imageCell) {
    imageCell.classList.add('carousel-slide-image');
    const image = imageCell.querySelector('img');
    if (image) image.loading = index === 0 ? 'eager' : 'lazy';
    slide.append(imageCell);
  }

  if (contentCells.length) {
    const content = document.createElement('div');
    content.className = 'carousel-slide-content';
    contentCells.forEach((cell) => {
      while (cell.firstChild) content.append(cell.firstChild);
    });
    slide.append(content);
  }

  const heading = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    if (!heading.id) heading.id = `${carouselId}-slide-${index + 1}-heading`;
    slide.setAttribute('aria-labelledby', heading.id);
  }

  return slide;
}

function createButton(label, className) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.setAttribute('aria-label', label);
  return button;
}

function createScrollHint(block) {
  const section = block.closest('.section');
  const nextSection = section?.nextElementSibling;
  const heading = nextSection?.querySelector('.default-content-wrapper h2, .default-content-wrapper h3');
  if (!heading?.id) return null;

  const hint = document.createElement('a');
  hint.className = 'carousel-scroll-hint';
  hint.href = `#${heading.id}`;

  const label = document.createElement('span');
  label.className = 'carousel-scroll-hint-label';
  label.textContent = 'Herunterscrollen';

  const icon = document.createElement('span');
  icon.className = 'carousel-scroll-hint-icon';
  icon.setAttribute('aria-hidden', 'true');

  hint.append(label, icon);
  return hint;
}

function createControls(block, carouselId, total) {
  if (total < 2) return null;

  const controls = document.createElement('nav');
  controls.className = 'carousel-slide-controls';
  controls.setAttribute('aria-label', 'Karussell-Steuerung');

  const indicators = document.createElement('ol');
  indicators.className = 'carousel-slide-indicators';
  for (let index = 0; index < total; index += 1) {
    const item = document.createElement('li');
    item.className = 'carousel-slide-indicator';
    item.dataset.targetSlide = `${index}`;
    const button = createButton(`Folie ${index + 1} von ${total} anzeigen`, 'carousel-indicator-button');
    button.textContent = `${index + 1}`;
    button.addEventListener('click', () => showSlide(block, index));
    item.append(button);
    indicators.append(item);
  }

  controls.append(indicators);
  controls.dataset.carouselId = carouselId;
  return controls;
}

function trackActiveSlide(block) {
  const track = block.querySelector('.carousel-slides');
  if (!track) return;

  let updateScheduled = false;
  track.addEventListener('scroll', () => {
    if (updateScheduled) return;
    updateScheduled = true;

    window.requestAnimationFrame(() => {
      updateScheduled = false;
      const slideWidth = track.clientWidth || 1;
      const index = Math.round(track.scrollLeft / slideWidth);
      setActiveSlide(block, index);
    });
  }, { passive: true });
}

export default function decorate(block) {
  const rows = [...block.children].filter((row) => row.tagName === 'DIV');
  if (!rows.length) return;

  carouselCount += 1;
  const carouselId = block.id || `viega-carousel-${carouselCount}`;
  block.id = carouselId;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Karussell');
  block.dataset.activeSlide = '0';

  const firstHeading = rows[0].querySelector('h1, h2, h3, h4, h5, h6');
  block.setAttribute('aria-label', firstHeading?.textContent.trim() || 'Viega Highlights');

  const container = document.createElement('div');
  container.className = 'carousel-slides-container';
  const track = document.createElement('ul');
  track.className = 'carousel-slides';
  track.setAttribute('aria-live', 'polite');

  rows.forEach((row, index) => {
    track.append(createSlide(row, index, rows.length, carouselId));
    row.remove();
  });

  container.append(track);
  const controls = createControls(block, carouselId, rows.length);
  block.replaceChildren(container);
  if (controls) block.append(controls);
  const scrollHint = createScrollHint(block);
  if (scrollHint) block.append(scrollHint);

  setActiveSlide(block, 0);
  trackActiveSlide(block);

  block.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showSlide(block, Number.parseInt(block.dataset.activeSlide || '0', 10) - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      showSlide(block, Number.parseInt(block.dataset.activeSlide || '0', 10) + 1);
    }
  });
}
