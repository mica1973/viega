import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const FOOTER_CATEGORY_LINKS = new Map([
  ['PRODUKTE', '/de/produkte.html'],
  ['SERVICE', '/de/service.html'],
  ['UNTERNEHMEN', '/de/unternehmen.html'],
]);

function decorateFooterCategoryLinks(footer) {
  footer.querySelectorAll('h3').forEach((heading) => {
    const href = FOOTER_CATEGORY_LINKS.get(heading.textContent.trim());
    if (!href) return;

    const link = document.createElement('a');
    link.href = href;
    link.textContent = heading.textContent.trim();
    heading.replaceChildren(link);
  });
}

function decorateFooterLinkGroups(footer) {
  const bottomRow = footer.lastElementChild;
  if (!bottomRow) return;

  bottomRow.querySelectorAll('p').forEach((paragraph) => {
    const links = [...paragraph.querySelectorAll('a[href]')];
    if (!links.length) return;

    const social = links.some((link) => /youtube|instagram|linkedin/i.test(`${link.textContent} ${link.href}`));
    const nav = document.createElement('nav');
    nav.className = social ? 'footer-links footer-social' : 'footer-links footer-legal';
    nav.setAttribute('aria-label', social ? 'Soziale Medien' : 'Rechtliche Informationen');

    const list = document.createElement('ul');
    links.forEach((link) => {
      const item = document.createElement('li');
      item.append(link);
      list.append(item);
    });

    nav.append(list);
    paragraph.replaceWith(nav);
  });
}

function createBackToTopLink() {
  const link = document.createElement('a');
  link.className = 'footer-back-to-top';
  link.href = '#';
  link.textContent = 'Hoch';
  return link;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);
  decorateFooterCategoryLinks(footer);
  decorateFooterLinkGroups(footer);
  footer.prepend(createBackToTopLink());

  block.append(footer);
}
