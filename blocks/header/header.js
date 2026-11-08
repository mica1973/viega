import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Closes the open nav dropdown (desktop) or the nav menu (mobile) on Escape
 * @param {KeyboardEvent} e keydown event
 */
function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('.nav-hamburger button')?.focus();
    }
  }
}

/**
 * Closes the open nav dropdown (desktop) or the nav menu (mobile) when focus leaves the nav
 * @param {FocusEvent} e focusout event
 */
function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean|string} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  const isExpanded = expanded === true || expanded === 'true';
  sections.querySelectorAll('.nav-drop > .nav-drop-toggle').forEach((button) => {
    button.setAttribute('aria-expanded', `${isExpanded}`);
    const label = button.dataset.menuLabel || 'Menü';
    button.setAttribute('aria-label', `${label} Untermenü ${isExpanded ? 'schließen' : 'öffnen'}`);
  });
  sections.querySelectorAll('.nav-subdrop-toggle').forEach((button) => {
    const label = button.dataset.menuLabel || 'Menü';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', `${label} Untermenü öffnen`);
  });
  sections.querySelectorAll('.nav-subdrop').forEach((subSection) => {
    subSection.parentElement.style.overflowY = '';
    subSection.parentElement.querySelectorAll(':scope > li:not(.nav-subdrop)').forEach((item) => {
      item.hidden = false;
    });
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  // the desktop nav is always expanded, so aria-expanded only applies to the mobile menu
  if (isDesktop.matches) nav.removeAttribute('aria-expanded');
  else nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  // Keep every submenu collapsed when the mobile drawer opens or closes.
  toggleAllNavSections(navSections, false);
  nav.querySelector('.nav-utilities')?.removeAttribute('hidden');
  button.setAttribute('aria-label', expanded ? 'Menü öffnen' : 'Menü schließen');

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

const VIEGA_ORIGIN = 'https://www.viega.de';

const NAV_UTILITY_LINKS = [
  {
    label: 'Merkliste',
    href: `${VIEGA_ORIGIN}/de/Merkliste.html`,
    icon: 'watchlist',
    count: 0,
  },
  {
    label: 'Karriere',
    href: `${VIEGA_ORIGIN}/de/unternehmen/Jobs.html`,
    icon: 'handshake',
  },
  {
    label: 'Ersatzteile',
    href: `${VIEGA_ORIGIN}/de/produkte/Ersatzteile.html`,
    icon: 'spareparts',
  },
  {
    label: 'KATALOG',
    href: `${VIEGA_ORIGIN}/de/produkte/Katalog.html`,
    icon: 'catalog',
    primary: true,
  },
];

// Viega's header symbols, redrawn inline so they remain same-origin in EDS preview.
const NAV_UTILITY_ICON_PATHS = {
  watchlist: [
    'M11.2 44.6V1m27.7 29v14.6H6.6V1h32.3v29.1',
    'M20.5 1v9.9l-2.6-2.4-2.6 2.4V1',
  ],
  handshake: [
    'M25.4 20.2c3.8 3.8 7.1 7.2 7.6 7.9 2.7 3.1-.8 5.8-3.3 3.3-.2-.2-3.5-3.7-5.3-5.4l5.7 5.7c2.8 3-.8 5.8-3.3 3.3-.2-.2-4.3-4.4-6-6l5 5c2.8 3-.8 5.8-3.3 3.3-.2-.2-4-4.1-5.5-5.7l2.9 2.9c2.1 2.9-1.2 5.3-3.7 3C15.6 37 4.7 26.2 3 24.2c-.2-.2-.8-.8-1.7-1.6M2.6 7.8C4.5 9.9 7.5 13 8.9 13h7.6m18.2 12.9c.4-.2.8-.4 1-.6.7-.4 8.3-5.3 8.9-5.7',
    'M43.6 7.8S33.5 14.2 33 14.2c-1.4-.1-5.5-1.3-7.3-1.8-1.8-.4-2.1-.4-3.8.2-.7.2-2.9 1.1-4.1 2.8-1.2 1.8-5.3 7.9-5.3 7.9-.8 1.2-.1 2.9 1.3 3 .6 0 1.1 0 1.9-.3.4-.2.9-.6 1.1-.9l3.1-4.5c1.7-2.2 3.2-2.5 4.5-2.7',
  ],
  spareparts: [
    'M14.61 34.88c1.43 3.7-.41 7.86-4.11 9.29-1.42.55-2.99.63-4.46.23l-.69-.68 5.53-1.85 1.4-4.81-3.98-3.98-4.75 1.45-1.91 5.49-.74-.94a7.174 7.174 0 015.38-8.62c1.42-.33 2.9-.22 4.25.31l20.18-20.22c-1.43-3.7.41-7.86 4.11-9.29 1.42-.55 2.99-.63 4.46-.23l.69.68-5.53 1.85-1.4 4.8 3.98 3.98 4.76-1.46 1.9-5.48.74.94a7.19 7.19 0 01-9.63 8.32L14.62 34.89z',
  ],
  catalog: [
    'M15.4 41.6H38c.6 0 1.1-.5 1.1-1.1V5.8c0-.6-.5-1.1-1.1-1.1H13.9V40c-.1.9.6 1.6 1.5 1.6',
    'M10 44.6c-2.1 0-3.7-1.7-3.7-3.7V4.5c0-1 .4-2 1.1-2.6C8.1 1.2 9 .8 10 .8c2.1 0 3.9 1.7 3.9 3.7v.2',
    'M13.9 39.8c0-2.1-1.8-3.5-3.8-3.5h0C8 36.3 6.3 38 6.3 40m3.7 4.6h22.7c.6 0 1.1-.5 1.1-1.1v-.1m-13.3-35h12.3M19 28.1h14.8m-6.7 4.7h6.7m-6.7 4.1h6.7m-16.4-4.8h6.9v5.6h-6.9zm0-20h18.5v11.7H17.4zm.7.5l17.2 10.8m.6-11.3L17.4 23.7',
  ],
};

function createUtilityIcon(name) {
  const namespace = 'http://www.w3.org/2000/svg';
  const icon = document.createElementNS(namespace, 'svg');
  icon.setAttribute('viewBox', '0 0 45.3 45.3');
  icon.classList.add('nav-utility-icon-svg');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');

  NAV_UTILITY_ICON_PATHS[name].forEach((definition) => {
    const path = document.createElementNS(namespace, 'path');
    path.setAttribute('d', definition);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    icon.append(path);
  });
  return icon;
}

function createUtilityNav() {
  const list = document.createElement('ul');
  list.className = 'nav-utilities';

  NAV_UTILITY_LINKS.forEach(({
    label,
    href,
    icon,
    primary,
    count,
  }) => {
    const item = document.createElement('li');
    if (primary) item.className = 'nav-utility-catalog';

    const link = document.createElement('a');
    link.className = 'nav-utility-link';
    link.href = href;
    if (typeof count === 'number') link.setAttribute('aria-label', `${label}, ${count} Elemente`);

    const iconWrap = document.createElement('span');
    iconWrap.className = `nav-utility-icon-wrap nav-utility-icon-wrap--${icon}`;
    iconWrap.append(createUtilityIcon(icon));
    if (typeof count === 'number') {
      const counter = document.createElement('span');
      counter.className = 'nav-utility-counter';
      counter.textContent = `${count}`;
      counter.setAttribute('aria-hidden', 'true');
      iconWrap.append(counter);
    }
    link.append(iconWrap);

    const text = document.createElement('span');
    text.className = 'nav-utility-label';
    text.textContent = label;
    link.append(text);
    item.append(link);
    list.append(item);
  });

  return list;
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Hauptnavigation');
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const navRows = [...nav.children];
  const brandRow = navRows.find((row) => row.querySelector('picture, img'));
  const sectionsRow = navRows.find((row) => row.querySelector(':scope > .default-content-wrapper > ul, :scope > ul'));
  const toolsRow = navRows.find((row) => row !== brandRow && row !== sectionsRow);
  brandRow?.classList.add('nav-brand');
  sectionsRow?.classList.add('nav-sections');
  toolsRow?.classList.add('nav-tools');

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand?.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container')?.classList.remove('button-container');
  }

  const navSections = nav.querySelector('.nav-sections');
  const navUtilities = createUtilityNav();
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection, index) => {
      const subList = navSection.querySelector(':scope > ul');
      if (!subList) return;

      navSection.classList.add('nav-drop');
      subList.classList.add('nav-mega-menu');
      const labelContainer = navSection.querySelector(':scope > p');
      const labelLink = labelContainer?.querySelector(':scope > a');
      const label = labelLink?.textContent.trim() || labelContainer?.textContent.trim() || `Menü ${index + 1}`;
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = `nav-drop-toggle ${labelLink ? 'nav-drop-indicator' : 'nav-drop-label'}`;
      toggle.dataset.menuLabel = label;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', subList.id || `nav-submenu-${index + 1}`);
      toggle.setAttribute('aria-label', `${label} Untermenü öffnen`);
      subList.id = subList.id || `nav-submenu-${index + 1}`;

      const backItem = document.createElement('li');
      backItem.className = 'nav-submenu-back-item';
      const backButton = document.createElement('button');
      backButton.type = 'button';
      backButton.className = 'nav-submenu-back';
      backButton.setAttribute('aria-label', `Zurück zu ${label}`);
      backButton.textContent = label;
      backButton.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', `${label} Untermenü öffnen`);
        toggle.focus();
      });
      backItem.append(backButton);
      subList.prepend(backItem);

      subList.querySelectorAll(':scope > li').forEach((subSection, subIndex) => {
        const nestedList = subSection.querySelector(':scope > ul');
        const nestedLabel = subSection.querySelector(':scope > p');
        if (!nestedList || !nestedLabel || nestedLabel.querySelector(':scope > a')) return;

        const nestedText = nestedLabel.textContent.trim() || `Untermenü ${subIndex + 1}`;
        const nestedToggle = document.createElement('button');
        nestedToggle.type = 'button';
        nestedToggle.className = 'nav-subdrop-toggle';
        nestedToggle.textContent = nestedText;
        nestedToggle.dataset.menuLabel = nestedText;
        nestedToggle.setAttribute('aria-expanded', 'false');
        nestedToggle.setAttribute('aria-controls', nestedList.id || `nav-submenu-${index + 1}-${subIndex + 1}`);
        nestedToggle.setAttribute('aria-label', `${nestedText} Untermenü öffnen`);
        nestedList.id = nestedList.id || `nav-submenu-${index + 1}-${subIndex + 1}`;
        subSection.classList.add('nav-subdrop');

        const nestedBackItem = document.createElement('li');
        nestedBackItem.className = 'nav-submenu-back-item';
        const nestedBack = document.createElement('button');
        nestedBack.type = 'button';
        nestedBack.className = 'nav-submenu-back';
        nestedBack.setAttribute('aria-label', `Zurück zu ${nestedText}`);
        nestedBack.textContent = nestedText;
        nestedBack.addEventListener('click', () => {
          nestedToggle.setAttribute('aria-expanded', 'false');
          nestedToggle.setAttribute('aria-label', `${nestedText} Untermenü öffnen`);
          subList.style.overflowY = '';
          navUtilities.hidden = false;
          subList.querySelectorAll(':scope > li:not(.nav-subdrop)').forEach((item) => {
            item.hidden = false;
          });
          nestedToggle.focus();
        });
        nestedBackItem.prepend(nestedBack);
        nestedList.prepend(nestedBackItem);
        nestedLabel.replaceWith(nestedToggle);

        nestedToggle.addEventListener('click', () => {
          const shouldExpandNested = nestedToggle.getAttribute('aria-expanded') !== 'true';
          subList.querySelectorAll(':scope > li.nav-subdrop > .nav-subdrop-toggle').forEach((button) => {
            const nestedToggleLabel = button.dataset.menuLabel || 'Menü';
            button.setAttribute('aria-expanded', 'false');
            button.setAttribute('aria-label', `${nestedToggleLabel} Untermenü öffnen`);
          });
          subList.querySelectorAll(':scope > li:not(.nav-subdrop)').forEach((item) => {
            item.hidden = !isDesktop.matches && shouldExpandNested;
          });
          subList.style.overflowY = shouldExpandNested && !isDesktop.matches ? 'visible' : '';
          navUtilities.hidden = !isDesktop.matches && shouldExpandNested;
          nestedToggle.setAttribute('aria-expanded', `${shouldExpandNested}`);
          nestedToggle.setAttribute('aria-label', `${nestedText} Untermenü ${shouldExpandNested ? 'schließen' : 'öffnen'}`);
        });
      });

      if (labelLink) {
        labelContainer.after(toggle);
      } else if (labelContainer) {
        toggle.textContent = label;
        labelContainer.replaceWith(toggle);
      } else {
        toggle.textContent = label;
        navSection.prepend(toggle);
      }

      toggle.addEventListener('click', (event) => {
        const shouldExpand = toggle.getAttribute('aria-expanded') !== 'true';
        // A pointer click causes pointerenter first; don't immediately undo the hover-open state.
        if (isDesktop.matches && !shouldExpand && event.detail > 0 && navSection.matches(':hover')) return;
        toggleAllNavSections(navSections);
        toggle.focus();
        toggle.setAttribute('aria-expanded', `${shouldExpand}`);
        toggle.setAttribute('aria-label', `${label} Untermenü ${shouldExpand ? 'schließen' : 'öffnen'}`);
      });

      navSection.addEventListener('pointerenter', () => {
        if (!isDesktop.matches) return;
        toggleAllNavSections(navSections);
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', `${label} Untermenü schließen`);
      });

      navSection.addEventListener('pointerleave', () => {
        if (!isDesktop.matches || navSection.contains(document.activeElement)) return;
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', `${label} Untermenü öffnen`);
      });

      navSection.addEventListener('focusin', () => {
        if (!isDesktop.matches) return;
        toggleAllNavSections(navSections);
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', `${label} Untermenü schließen`);
      });

      navSection.addEventListener('focusout', (event) => {
        if (!isDesktop.matches || navSection.contains(event.relatedTarget)) return;
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', `${label} Untermenü öffnen`);
      });
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Menü öffnen">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);

  const navMobilePanel = document.createElement('div');
  navMobilePanel.className = 'nav-mobile-panel';
  if (navSections) navMobilePanel.append(navSections);
  navMobilePanel.append(navUtilities);
  nav.append(navMobilePanel);

  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  backdrop.addEventListener('click', () => toggleMenu(nav, navSections, false));
  nav.prepend(backdrop);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
