import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
  decorateBlock,
} from './aem.js';

const VIEGA_HOMEPAGE_PATHS = new Set(['/', '/index', '/index.html', '/de/homepage', '/de/homepage.html']);
const VIEGA_WORLD_VIDEO = {
  url: 'https://www.youtube.com/watch?v=POKOn8Fpj9A',
  title: 'Viega World: Das neue Herz unserer Marke!',
  poster: '/media/viega-world-video-poster.jpg',
};

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Map Viega's authored first-section teaser cards to the homepage hero carousel.
 * The DA source currently expresses these four slides as a Cards block.
 * @param {Element} main The container element
 */
function buildViegaHomepageCarousel(main) {
  if (!VIEGA_HOMEPAGE_PATHS.has(window.location.pathname)) return;

  const heroSection = main.firstElementChild;
  const title = heroSection?.querySelector('h1')?.textContent.trim();
  if (title !== 'Viega Deutschland') return;

  const heroCards = heroSection.querySelector('.cards');
  if (!heroCards) return;

  const rows = [...heroCards.children].filter((row) => row.tagName === 'DIV');
  const isHeroCards = rows.length === 4 && rows.every((row) => (
    row.querySelector('picture, img')
    && row.querySelector('h2, h3')
    && row.querySelector('a[href]')
  ));
  if (!isHeroCards) return;

  const pageHeading = heroSection.querySelector('h1');
  const firstSlideHeading = rows[0].querySelector('h2, h3');
  if (pageHeading && firstSlideHeading) {
    const heroHeading = document.createElement('h1');
    heroHeading.id = firstSlideHeading.id || pageHeading.id;
    while (firstSlideHeading.firstChild) heroHeading.append(firstSlideHeading.firstChild);
    firstSlideHeading.replaceWith(heroHeading);

    const titleWrapper = pageHeading.parentElement;
    pageHeading.remove();
    const isEmptyTitleWrapper = titleWrapper !== heroSection
      && !titleWrapper.children.length
      && !titleWrapper.textContent.trim();
    if (isEmptyTitleWrapper) titleWrapper.remove();
  }

  rows.forEach((row, index) => {
    const image = row.querySelector('img');
    if (image) image.loading = index === 0 ? 'eager' : 'lazy';
  });

  heroCards.classList.remove('cards');
  heroCards.classList.add('carousel');
}

/**
 * Rebuilds the homepage Viega World section around its authored teaser and source video.
 * The public homepage renders the video dynamically, so the source .plain.html has no video block.
 * @param {Element} main The main container element
 */
function buildViegaHomepageWorld(main) {
  if (!VIEGA_HOMEPAGE_PATHS.has(window.location.pathname)) return;

  const heading = [...main.querySelectorAll('h2')].find((item) => (
    item.textContent.trim() === 'Das Herz unserer Marke: die Viega World!'
  ));
  const section = heading?.parentElement;
  const columns = section?.querySelector(':scope > .columns');
  const row = columns?.firstElementChild;
  const intro = [...(section?.children || [])].find((child) => (
    child.tagName === 'P' && child.textContent.trim().startsWith('Mit der Viega World')
  ));
  if (!heading || !row || row.children.length !== 2 || columns.classList.contains('viega-world-layout')) return;

  const [imageColumn, teaserContent] = [...row.children];
  if (!imageColumn.querySelector('picture') || !teaserContent.querySelector('a[href]')) return;

  const teaser = document.createElement('div');
  teaser.className = 'columns-world-teaser';
  const teaserLink = teaserContent.querySelector('a[href]');
  if (!teaserLink) return;
  const teaserDestination = teaserLink.getAttribute('href');
  const teaserLinkParagraph = teaserLink.closest('p');
  if (
    teaserLinkParagraph
    && teaserLinkParagraph.textContent.trim() === teaserLink.textContent.trim()
  ) {
    teaserLinkParagraph.remove();
  }
  teaserContent.classList.add('columns-world-teaser-content');

  const teaserCardLink = document.createElement('a');
  teaserCardLink.className = 'columns-world-teaser-link';
  teaserCardLink.href = teaserDestination;
  teaserCardLink.append(imageColumn, teaserContent);
  teaser.append(teaserCardLink);

  const copy = document.createElement('div');
  copy.className = 'columns-world-copy';
  if (intro) copy.append(intro);
  copy.append(teaser);

  const videoLink = document.createElement('a');
  videoLink.href = VIEGA_WORLD_VIDEO.url;
  videoLink.textContent = VIEGA_WORLD_VIDEO.title;

  const poster = document.createElement('picture');
  const posterImage = document.createElement('img');
  posterImage.src = VIEGA_WORLD_VIDEO.poster;
  posterImage.alt = '';
  posterImage.width = 320;
  posterImage.height = 180;
  posterImage.loading = 'lazy';
  posterImage.decoding = 'async';
  poster.append(posterImage);

  const video = buildBlock('video', { elems: [videoLink, poster] });
  const videoColumn = document.createElement('div');
  videoColumn.className = 'columns-world-video';
  videoColumn.append(video);

  row.replaceChildren(copy, videoColumn);
  decorateBlock(video);
  columns.classList.add('viega-world-layout');
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildViegaHomepageCarousel(main);
    buildViegaHomepageWorld(main);
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./consent-check.js');
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
