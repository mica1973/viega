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

const NAV_UTILITY_LINKS = [
  { label: 'Merkliste', href: '/de/Merkliste.html', icon: 'bookmark' },
  { label: 'Karriere', href: '/de/unternehmen/Jobs.html', icon: 'career' },
  { label: 'Ersatzteile', href: '/de/produkte/Ersatzteile.html', icon: 'parts' },
  {
    label: 'KATALOG',
    href: '/de/produkte/Katalog.html',
    icon: 'catalog',
    primary: true,
  },
];

const NAV_UTILITY_ICON_PATHS = {
  bookmark: 'M6 3.5h12v17l-6-4-6 4z',
  career: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
  parts: 'M14.5 6.5a4 4 0 0 0-5.2 5.2L3.5 17.5l3 3 5.8-5.8a4 4 0 0 0 5.2-5.2l-2.4 2.4-3-3z',
  catalog: 'M4 4.5c3.1-.8 5.8-.4 8 1.2v14c-2.2-1.6-4.9-2-8-1.2zM20 4.5c-3.1-.8-5.8-.4-8 1.2v14c2.2-1.6 4.9-2 8-1.2z',
};

function createUtilityIcon(name) {
  const namespace = 'http://www.w3.org/2000/svg';
  const icon = document.createElementNS(namespace, 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');

  const path = document.createElementNS(namespace, 'path');
  path.setAttribute('d', NAV_UTILITY_ICON_PATHS[name]);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.6');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  icon.append(path);
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
  }) => {
    const item = document.createElement('li');
    if (primary) item.className = 'nav-utility-catalog';

    const link = document.createElement('a');
    link.className = 'nav-utility-link';
    link.href = href;
    link.append(createUtilityIcon(icon));

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
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection, index) => {
      const subList = navSection.querySelector(':scope > ul');
      if (!subList) return;

      navSection.classList.add('nav-drop');
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

      if (labelLink) {
        labelContainer.after(toggle);
      } else if (labelContainer) {
        toggle.textContent = label;
        labelContainer.replaceWith(toggle);
      } else {
        toggle.textContent = label;
        navSection.prepend(toggle);
      }

      toggle.addEventListener('click', () => {
        const shouldExpand = toggle.getAttribute('aria-expanded') !== 'true';
        if (isDesktop.matches) {
          toggleAllNavSections(navSections);
          toggle.focus();
        }
        toggle.setAttribute('aria-expanded', `${shouldExpand}`);
        toggle.setAttribute('aria-label', `${label} Untermenü ${shouldExpand ? 'schließen' : 'öffnen'}`);
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
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  nav.append(createUtilityNav());
  navWrapper.append(nav);
  block.append(navWrapper);
}
