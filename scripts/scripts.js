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

const VIEGA_PRESSCONNECTORS_PATH = '/de/produkte/pressverbindersysteme';

const VIEGA_PRESS_ANCHORS = [
  ['Anwendungsbereiche', 'pvs-applications', 'Anwendungsbereiche der Viega Pressverbindungstechnik'],
  ['Funktion', 'pvs-function', 'Pressverbindungstechnik: Zeitersparnis und Sicherheit bei jeder Installation.'],
  ['Besonderheiten', 'pvs-features', 'Deshalb ist die Viega Presstechnik so besonders'],
  ['FAQ', 'pvs-faq', 'Häufig gestellte Fragen'],
  ['Vorteile', 'pvs-benefits', 'Die Viega Vorteile im Überblick'],
  ['Referenzen', 'pvs-references', 'Hier werden die Viega Pressverbinder bereits eingesetzt'],
  ['Kontakt', 'pvs-contact', 'Kontakt'],
];

const VIEGA_PRESS_APPLICATIONS = {
  'Viega Presssystem für Trinkwasser': 'TRINKWASSER',
  'Viega Presssystem für Heizen und Kühlen': 'HEIZEN UND KÜHLEN',
  'Viega Presssystem für Gasinstallationen': 'BRENNGASE',
};

const VIEGA_BENEFIT_ICONS = {
  Zeitersparnis: 'icon--icon_clock',
  Zuverlässigkeit: 'icon--icon_checklist',
  Kosteneffizienz: 'icon--icon_ProductionCosts',
  Sicherheit: 'icon--icon_shield',
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
 * Builds authoring-friendly cards from the imported application images and copy.
 * @param {Element} section The source section
 * @returns {boolean} Whether the cards were built
 */
function buildViegaPressApplications(section) {
  const paragraph = [...section.children].find((child) => (
    child.tagName === 'P'
    && child.querySelectorAll(':scope > picture img[alt^="Viega Presssystem"]').length === 3
  ));
  if (!paragraph) return false;

  const entries = [];
  let currentEntry;
  [...paragraph.childNodes].forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'PICTURE') {
      currentEntry = {
        picture: node,
        copy: '',
        link: null,
      };
      entries.push(currentEntry);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.matches('a[href]')) {
      if (currentEntry) currentEntry.link = node;
    } else if (node.nodeType === Node.TEXT_NODE && currentEntry) {
      currentEntry.copy += node.textContent;
    }
  });

  if (entries.length !== 3 || entries.some((entry) => !entry.picture || !entry.link)) return false;

  const cards = entries.map((entry) => {
    const alt = entry.picture.querySelector('img')?.alt || '';
    const label = VIEGA_PRESS_APPLICATIONS[alt];
    if (!label) return null;
    const copy = entry.copy.trim().replace(new RegExp(`^${label}\\s*`, 'i'), '').trim().replace(/\s+/g, ' ');
    const heading = document.createElement('h3');
    heading.textContent = label;
    const description = document.createElement('p');
    description.textContent = copy;
    const linkParagraph = document.createElement('p');
    linkParagraph.append(entry.link);
    return [
      { elems: [entry.picture] },
      { elems: [heading, description, linkParagraph] },
    ];
  });

  if (cards.some((card) => !card)) return false;
  const block = buildBlock('cards', cards);
  block.classList.add('pvs-applications');
  block.querySelectorAll('.cards-card-body h3').forEach((heading) => {
    const label = document.createElement('span');
    label.className = 'pvs-application-label';
    label.textContent = heading.textContent;
    label.setAttribute('aria-hidden', 'true');
    heading.closest('li')?.append(label);
  });
  paragraph.replaceWith(block);
  section.classList.add('pvs-applications-section');
  return true;
}

/**
 * Converts imported reference teasers into a responsive card grid.
 * @param {Element} section The source section
 * @returns {boolean} Whether the cards were built
 */
function buildViegaPressReferences(section) {
  const children = [...section.children];
  const entries = [];
  let currentEntry;

  children.forEach((child) => {
    if (child.tagName === 'P' && child.querySelector(':scope > picture')) {
      currentEntry = { picture: child.querySelector(':scope > picture'), heading: null, description: null };
      entries.push(currentEntry);
    } else if (child.tagName === 'H3' && currentEntry && !currentEntry.heading) {
      currentEntry.heading = child;
    } else if (child.tagName === 'P' && currentEntry?.heading && !currentEntry.description) {
      currentEntry.description = child;
    }
  });

  if (
    entries.length !== 4
    || entries.some((entry) => !entry.picture || !entry.heading || !entry.description)
  ) return false;

  const cards = entries.map((entry) => [
    { elems: [entry.picture] },
    { elems: [entry.heading, entry.description] },
  ]);
  const block = buildBlock('cards', cards);
  block.classList.add('pvs-references');
  section.replaceChildren(block);
  section.classList.add('pvs-references-section');
  return true;
}

/**
 * Restores the authored two-column installation explainer and its linked video tile.
 * @param {Element} section The installation-method content section
 * @returns {boolean} Whether the media tile was built
 */
function buildViegaPressFunctionMedia(section) {
  const children = [...section.children];
  const intro = children.find((child) => (
    child.tagName === 'P'
    && child.textContent.trim().startsWith('Die kalte Pressverbindungstechnik')
  ));
  const steps = children.find((child) => child.tagName === 'OL' && child.querySelector(':scope > li'));
  const summary = children.find((child) => (
    child.tagName === 'P'
    && child.textContent.trim().startsWith('Somit erhalten Sie in drei einfachen Montageschritten')
  ));
  const poster = children.find((child) => child.tagName === 'P' && child.querySelector(':scope > picture'));
  const consentHeading = children.find((child) => child.tagName === 'H4');
  const consentCopy = consentHeading?.nextElementSibling?.tagName === 'P' ? consentHeading.nextElementSibling : null;
  const unavailable = children.find((child) => (
    child.tagName === 'H3'
    && child.textContent.trim().startsWith('Der angeforderte Inhalt ist leider nicht verfügbar')
  ));
  const linkParagraph = children.find((child) => (
    child.tagName === 'P'
    && child.querySelector('a[href^="https://instructionalvideos.viega.com/"]')
  ));
  const videoLink = linkParagraph?.querySelector('a[href]');
  const picture = poster?.querySelector(':scope > picture');
  if (
    !intro
    || !steps
    || !summary
    || !picture
    || !consentHeading
    || !consentCopy
    || !unavailable
    || !videoLink
  ) return false;

  const figure = document.createElement('figure');
  figure.className = 'pvs-function-media';
  figure.append(picture);

  const caption = document.createElement('figcaption');
  consentHeading.textContent = consentHeading.textContent.replace('$$service$$', 'Yntro');
  consentHeading.className = 'pvs-function-consent-title';
  consentCopy.classList.add('pvs-function-consent-copy');
  unavailable.className = 'pvs-function-unavailable';
  videoLink.className = 'pvs-function-video-link';
  caption.append(consentHeading, consentCopy, unavailable, videoLink);
  figure.append(caption);
  section.replaceChildren(intro, steps, summary, figure);
  return true;
}

/**
 * Recreates the original two-column SC-Contur text and privacy-respecting video tile.
 * @param {Element} section The SC-Contur content section
 * @returns {boolean} Whether the media tile was built
 */
function buildViegaPressFeatureMedia(section) {
  const children = [...section.children];
  const heading = children.find((child) => child.tagName === 'H3' && child.textContent.trim() === 'Die Viega SC-Contur');
  const poster = children.find((child) => child.tagName === 'P' && child.querySelector(':scope > picture'));
  const consentHeading = children.find((child) => child.tagName === 'H4');
  const consentCopy = consentHeading?.nextElementSibling?.tagName === 'P' ? consentHeading.nextElementSibling : null;
  const linkParagraph = children.find((child) => (
    child.tagName === 'P' && child.querySelector('a[href="https://www.youtube.com/watch?v=8Hd8nv4VgUU"]')
  ));
  const videoLink = linkParagraph?.querySelector('a[href]');
  const picture = poster?.querySelector(':scope > picture');
  const copy = children.filter((child) => (
    child.tagName === 'P'
    && child !== poster
    && child !== consentCopy
    && child !== linkParagraph
  ));
  if (
    !heading
    || copy.length !== 3
    || !picture
    || !consentHeading
    || !consentCopy
    || !videoLink
  ) return false;

  const figure = document.createElement('figure');
  figure.className = 'pvs-feature-media';
  figure.append(picture);
  const caption = document.createElement('figcaption');
  consentHeading.textContent = consentHeading.textContent.replace('$$service$$', 'Youtube');
  consentHeading.className = 'pvs-feature-consent-title';
  consentCopy.classList.add('pvs-feature-consent-copy');
  videoLink.className = 'pvs-feature-video-link';
  caption.append(consentHeading, consentCopy, videoLink);
  figure.append(caption);

  heading.classList.add('pvs-feature-heading');
  copy.forEach((paragraph, index) => paragraph.classList.add(`pvs-feature-copy-${index + 1}`));
  section.replaceChildren(heading, ...copy, figure);
  return true;
}

/**
 * Adds page-specific navigation and responsive layouts to the Viega press-systems page.
 * All text and links are re-used from the authored document; no products are inferred or added.
 * @param {Element} main The un-decorated main element
 */
function buildViegaPressConnectorsPage(main) {
  if (window.location.pathname.replace(/\/$/, '') !== VIEGA_PRESSCONNECTORS_PATH) return;

  const h1 = main.querySelector('h1');
  if (!h1 || !h1.textContent.includes('Pressverbindersysteme')) return;
  main.classList.add('pvs-page');

  const sections = [...main.children].filter((child) => child.tagName === 'DIV');
  const titleSection = sections.find((section) => section.contains(h1));
  if (titleSection) {
    titleSection.classList.add('pvs-title-section');
    if (!titleSection.querySelector('.pvs-breadcrumb')) {
      const breadcrumb = document.createElement('nav');
      breadcrumb.className = 'pvs-breadcrumb';
      breadcrumb.setAttribute('aria-label', 'Brotkrumennavigation');
      const crumbs = [
        { label: 'Viega Deutschland', href: '/' },
        { label: 'Produkte', href: 'https://www.viega.de/de/produkte.html' },
        { label: 'Rohrleitungstechnik', current: true },
      ];
      const list = document.createElement('ol');
      crumbs.forEach((crumb) => {
        const item = document.createElement('li');
        if (crumb.current) {
          const current = document.createElement('span');
          current.textContent = crumb.label;
          current.setAttribute('aria-current', 'page');
          item.append(current);
        } else {
          const link = document.createElement('a');
          link.href = crumb.href;
          link.textContent = crumb.label;
          item.append(link);
        }
        list.append(item);
      });
      breadcrumb.append(list);
      h1.before(breadcrumb);
    }
  }

  const introSection = sections.find((section) => (
    section.querySelector(':scope > p')?.textContent.trim().startsWith('Mit Viega Pressverbindersystemen')
  ));
  introSection?.classList.add('pvs-intro-section');

  const overviewSection = sections.find((section) => (
    section.querySelector(':scope > p > picture img')
    && section.querySelectorAll(':scope > ul > li > h4').length >= 10
  ));
  if (overviewSection) {
    const picture = overviewSection.querySelector(':scope > p > picture');
    const products = overviewSection.querySelector(':scope > ul');
    if (picture && products) {
      const block = buildBlock('presshotspots', [[
        { elems: [picture] },
        { elems: [products] },
      ]]);
      overviewSection.replaceChildren(block);
      overviewSection.classList.add('pvs-overview-section');
    }
  }

  const anchorSection = sections.find((section) => (
    section.querySelectorAll(':scope > ul > li > a[href*="#sticky_"]').length === VIEGA_PRESS_ANCHORS.length
  ));
  if (anchorSection) {
    anchorSection.classList.add('pvs-anchor-nav');
    const links = [...anchorSection.querySelectorAll(':scope > ul > li > a[href*="#sticky_"]')];
    VIEGA_PRESS_ANCHORS.forEach(([label, id, headingText]) => {
      const headingSection = sections.find((section) => (
        [...section.querySelectorAll(':scope > h2')].some((heading) => heading.textContent.trim() === headingText)
      ));
      const target = headingSection?.querySelector(':scope > h2');
      if (target) {
        target.id = id;
        headingSection.classList.add(`${id}-heading`);
      }
      const link = links.find((item) => item.textContent.trim() === label);
      if (link) link.setAttribute('href', `#${id}`);
    });
  }

  const brochureSection = sections.find((section) => (
    section.querySelector('h3 a[href*="Broschuere-Pressverbindersysteme"]')
  ));
  brochureSection?.classList.add('pvs-brochure-section');
  const brochureLink = brochureSection?.querySelector('h3 a[href*="Broschuere-Pressverbindersysteme"]');
  if (brochureLink && !main.querySelector('.pvs-sticky-brochure')) {
    const stickyBrochure = document.createElement('a');
    stickyBrochure.className = 'pvs-sticky-brochure';
    stickyBrochure.href = brochureLink.href;
    stickyBrochure.setAttribute('aria-label', 'Auf einen Blick: Broschüre zu Pressverbindersystemen');
    const label = document.createElement('span');
    label.className = 'pvs-sticky-brochure-label';
    label.textContent = 'Auf einen Blick';
    const icon = document.createElement('span');
    icon.className = 'pvs-sticky-brochure-icon';
    icon.setAttribute('aria-hidden', 'true');
    stickyBrochure.append(label, icon);
    main.append(stickyBrochure);
    const brochureObserver = new IntersectionObserver(([entry]) => {
      stickyBrochure.classList.toggle('is-visible', !entry.isIntersecting);
    });
    if (titleSection) brochureObserver.observe(titleSection);
  }

  const applicationsSection = sections.find((section) => (
    section.querySelectorAll(':scope > p > picture img[alt^="Viega Presssystem"]').length === 3
  ));
  if (applicationsSection) buildViegaPressApplications(applicationsSection);

  const functionHeadingSection = sections.find((section) => (
    [...section.querySelectorAll(':scope > h2')].some((heading) => (
      heading.textContent.trim() === 'Pressverbindungstechnik: Zeitersparnis und Sicherheit bei jeder Installation.'
    ))
  ));
  const functionHeading = functionHeadingSection?.querySelector(':scope > h2');
  if (functionHeading) functionHeading.id = 'pvs-function';
  const functionContent = functionHeadingSection?.nextElementSibling;
  if (functionContent?.querySelector(':scope > ol > li')) {
    functionContent.classList.add('pvs-function-content');
    buildViegaPressFunctionMedia(functionContent);
  }

  const toolsHeadingSection = sections.find((section) => (
    [...section.querySelectorAll(':scope > h2')].some((heading) => (
      heading.textContent.trim() === 'Macht das Viega System komplett: Presswerkzeuge und Zubehör'
    ))
  ));
  toolsHeadingSection?.classList.add('pvs-tools-heading');

  ['Viega Pressguns', 'Viega Systemarmaturen'].forEach((featureTitle) => {
    const featureSection = sections.find((section) => (
      section.querySelector(':scope > h3')?.textContent.trim() === featureTitle
    ));
    if (!featureSection) return;
    featureSection.classList.add('pvs-product-feature');
    featureSection.classList.add(featureTitle === 'Viega Systemarmaturen'
      ? 'pvs-product-feature-systemarmaturen'
      : 'pvs-product-feature-pressguns');
    const heading = featureSection.querySelector(':scope > h3');
    const paragraphs = [...featureSection.querySelectorAll(':scope > p')];
    const image = paragraphs.find((paragraph) => paragraph.querySelector(':scope > picture'));
    const link = paragraphs.find((paragraph) => paragraph.querySelector(':scope > a[href]'));
    const description = paragraphs.find((paragraph) => paragraph !== image && paragraph !== link);
    heading?.classList.add('pvs-product-feature-heading');
    description?.classList.add('pvs-product-feature-copy');
    link?.classList.add('pvs-product-feature-link');
    image?.classList.add('pvs-product-feature-image');
  });

  const featuresHeadingSection = sections.find((section) => (
    [...section.querySelectorAll(':scope > h2')].some((heading) => heading.textContent.trim() === 'Deshalb ist die Viega Presstechnik so besonders')
  ));
  const featuresHeading = featuresHeadingSection?.querySelector(':scope > h2');
  if (featuresHeading) featuresHeading.id = 'pvs-features';
  const featureContent = featuresHeadingSection?.nextElementSibling;
  if (featureContent) {
    featureContent.classList.add('pvs-features-content');
    buildViegaPressFeatureMedia(featureContent);
  }

  const faqHeadingSection = sections.find((section) => (
    [...section.querySelectorAll(':scope > h2')].some((heading) => heading.textContent.trim() === 'Häufig gestellte Fragen')
  ));
  const faqHeading = faqHeadingSection?.querySelector(':scope > h2');
  if (faqHeading) faqHeading.id = 'pvs-faq';
  const faqSection = faqHeadingSection?.nextElementSibling;
  const faqItems = faqSection ? [...faqSection.querySelectorAll(':scope > ul > li')].filter((item) => item.querySelector('h4, p')) : [];
  if (faqItems.length >= 5) {
    const faqLists = [document.createElement('ul'), document.createElement('ul')];
    faqLists.forEach((list) => list.classList.add('pvs-faq-list'));
    const itemsPerColumn = Math.ceil(faqItems.length / faqLists.length);
    faqItems.forEach((item, index) => {
      const question = item.querySelector('h4');
      if (!question) return;
      const faqItem = document.createElement('li');
      faqItem.className = 'pvs-faq-item';
      const heading = document.createElement('h3');
      const trigger = document.createElement('button');
      const answer = document.createElement('div');
      const answerId = `pvs-faq-answer-${index + 1}`;
      trigger.className = 'pvs-faq-trigger';
      trigger.type = 'button';
      trigger.id = `pvs-faq-question-${index + 1}`;
      trigger.textContent = question.textContent.trim();
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', answerId);
      answer.className = 'pvs-faq-answer';
      answer.id = answerId;
      answer.setAttribute('role', 'region');
      answer.setAttribute('aria-labelledby', trigger.id);
      answer.hidden = true;
      [...item.children]
        .filter((child) => child !== question)
        .forEach((child) => answer.append(child.cloneNode(true)));
      trigger.addEventListener('click', () => {
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!expanded));
        answer.hidden = expanded;
      });
      heading.append(trigger);
      faqItem.append(heading, answer);
      faqLists[Math.floor(index / itemsPerColumn)].append(faqItem);
    });
    faqSection.replaceChildren(...faqLists);
    faqSection.classList.add('pvs-faq-section');
  }

  const benefitsSection = sections.find((section) => (
    [...section.querySelectorAll(':scope > h2')].some((heading) => heading.textContent.trim() === 'Die Viega Vorteile im Überblick')
  ));
  const benefitsHeading = benefitsSection?.querySelector(':scope > h2');
  if (benefitsHeading) {
    benefitsHeading.id = 'pvs-benefits';
    const benefitCards = document.createElement('ul');
    benefitCards.className = 'pvs-benefits-grid';
    const children = [...benefitsSection.children];
    for (let index = 0; index < children.length; index += 1) {
      if (children[index].tagName === 'H3') {
        const card = document.createElement('li');
        card.className = 'pvs-benefit-card';
        const iconName = VIEGA_BENEFIT_ICONS[children[index].textContent.trim()];
        if (iconName) {
          const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          icon.classList.add('pvs-benefit-icon');
          icon.setAttribute('viewBox', '0 0 48 48');
          icon.setAttribute('aria-hidden', 'true');
          icon.setAttribute('focusable', 'false');
          const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
          const iconPath = `/icons/pvs-benefits.svg#${iconName}`;
          use.setAttribute('href', iconPath);
          use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', iconPath);
          icon.append(use);
          card.append(icon);
        }
        card.append(children[index]);
        const description = children[index + 1];
        if (description?.tagName === 'P') {
          card.append(description);
          index += 1;
        }
        benefitCards.append(card);
      }
    }
    benefitsSection.replaceChildren(benefitsHeading, benefitCards);
    benefitsSection.classList.add('pvs-benefits-section');
  }

  const referencesHeadingSection = sections.find((section) => (
    [...section.querySelectorAll(':scope > h2')].some((heading) => heading.textContent.trim() === 'Hier werden die Viega Pressverbinder bereits eingesetzt')
  ));
  const referencesHeading = referencesHeadingSection?.querySelector(':scope > h2');
  if (referencesHeading) referencesHeading.id = 'pvs-references';
  const referencesSection = referencesHeadingSection?.nextElementSibling;
  if (referencesSection) buildViegaPressReferences(referencesSection);
  referencesHeadingSection?.classList.add('pvs-references-heading');

  const contactHeadingSection = sections.find((section) => (
    [...section.querySelectorAll(':scope > h2')].some((heading) => heading.textContent.trim() === 'Kontakt')
  ));
  const contactHeading = contactHeadingSection?.querySelector(':scope > h2');
  if (contactHeading) contactHeading.id = 'pvs-contact';
  const contactContent = contactHeadingSection?.nextElementSibling;
  if (contactContent?.tagName === 'DIV') contactContent.classList.add('pvs-contact-content');
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
    buildViegaPressConnectorsPage(main);
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
  const [, locale] = window.location.pathname.match(/^\/([a-z]{2})(?:\/|$)/) || [];
  document.documentElement.lang = locale === 'en' ? 'en' : 'de';
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
