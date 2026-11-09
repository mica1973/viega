const HOTSPOT_POSITIONS = [
  { x: '38%', y: '45%' },
  { x: '45%', y: '65%' },
  { x: '24%', y: '45%' },
  { x: '52%', y: '55%' },
  { x: '58%', y: '45%' },
  { x: '63%', y: '64%' },
  { x: '78%', y: '70%' },
  { x: '83%', y: '50%' },
  { x: '93%', y: '59%' },
  { x: '17%', y: '65%' },
  { x: '70%', y: '50%' },
  { x: '10%', y: '55%' },
];

/**
 * Decorates the press-system overview as a responsive image hotspot panel.
 * @param {Element} block The presshotspots block
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  const picture = row?.children[0]?.querySelector('picture');
  const sourceList = row?.children[1]?.querySelector('ul');
  if (!picture || !sourceList) return;

  const stage = document.createElement('div');
  stage.className = 'presshotspots-stage';
  stage.append(picture);

  const viewport = document.createElement('div');
  viewport.className = 'presshotspots-viewport';
  viewport.append(stage);

  const list = document.createElement('ol');
  list.className = 'presshotspots-list';
  [...sourceList.children].forEach((sourceItem, index) => {
    const position = HOTSPOT_POSITIONS[index] || { x: '50%', y: '50%' };
    const title = sourceItem.querySelector('h4')?.textContent.trim() || `System ${index + 1}`;
    const item = document.createElement('li');
    item.className = 'presshotspots-item';
    item.style.setProperty('--hotspot-x', position.x);
    item.style.setProperty('--hotspot-y', position.y);
    item.dataset.popoverSide = Number.parseInt(position.x, 10) > 45 ? 'left' : 'right';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'presshotspots-trigger';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `${title}: Details öffnen`);
    const label = document.createElement('span');
    label.className = 'presshotspots-label';
    label.textContent = title;
    button.append(label);

    const details = document.createElement('div');
    details.className = 'presshotspots-details';
    details.id = `presshotspots-details-${index + 1}`;
    button.setAttribute('aria-controls', details.id);
    while (sourceItem.firstChild) details.append(sourceItem.firstChild);

    item.append(button, details);
    list.append(item);
  });

  stage.append(list);

  const productItems = [...list.children];
  if (!productItems.length) {
    block.replaceChildren(viewport);
    return;
  }
  const products = productItems.map((item, index) => {
    const details = item.querySelector('.presshotspots-details');
    const link = details?.querySelector('a[href]');
    return {
      title: details?.querySelector('h4')?.textContent.trim() || `System ${index + 1}`,
      description: details?.querySelector('p')?.textContent.trim() || '',
      href: link?.href || '#',
      linkText: link?.textContent.trim() || 'Mehr erfahren',
    };
  });

  const mobilePanel = document.createElement('div');
  mobilePanel.className = 'presshotspots-mobile-panel';
  mobilePanel.id = 'presshotspots-mobile-panel';
  mobilePanel.setAttribute('aria-live', 'polite');
  productItems.forEach((item) => {
    const trigger = item.querySelector('.presshotspots-trigger');
    const details = item.querySelector('.presshotspots-details');
    trigger?.setAttribute('aria-controls', `${details?.id || ''} ${mobilePanel.id}`.trim());
  });
  const panelTitle = document.createElement('h3');
  const panelDescription = document.createElement('p');
  const panelLink = document.createElement('a');
  mobilePanel.append(panelTitle, panelDescription, panelLink);

  const mobileNav = document.createElement('div');
  mobileNav.className = 'presshotspots-mobile-nav';
  const counter = document.createElement('span');
  counter.className = 'presshotspots-mobile-count';
  const previous = document.createElement('button');
  previous.type = 'button';
  previous.className = 'presshotspots-mobile-arrow';
  previous.setAttribute('aria-label', 'Vorheriges Pressverbindersystem');
  previous.textContent = '‹';
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'presshotspots-mobile-arrow';
  next.setAttribute('aria-label', 'Nächstes Pressverbindersystem');
  next.textContent = '›';
  const controls = document.createElement('div');
  controls.className = 'presshotspots-mobile-controls';
  controls.append(previous, next);
  mobileNav.append(counter, controls);

  let selectedIndex = 0;
  function selectProduct(index) {
    selectedIndex = (index + products.length) % products.length;
    productItems.forEach((item, itemIndex) => {
      const selected = itemIndex === selectedIndex;
      item.dataset.selected = String(selected);
      item.querySelector('.presshotspots-trigger')?.setAttribute('aria-pressed', String(selected));
    });
    const product = products[selectedIndex];
    panelTitle.textContent = product.title;
    panelDescription.textContent = product.description;
    panelLink.href = product.href;
    panelLink.textContent = product.linkText;
    counter.textContent = `${selectedIndex + 1} / ${products.length}`;
  }

  productItems.forEach((item, index) => {
    const button = item.querySelector('.presshotspots-trigger');
    button?.addEventListener('click', () => {
      if (window.matchMedia('(width < 900px)').matches) {
        selectProduct(index);
        return;
      }
      const shouldOpen = item.dataset.open !== 'true';
      list.querySelectorAll('.presshotspots-item').forEach((other) => {
        other.dataset.open = 'false';
        other.querySelector('.presshotspots-trigger')?.setAttribute('aria-expanded', 'false');
      });
      if (shouldOpen) {
        item.dataset.open = 'true';
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });

  previous.addEventListener('click', () => selectProduct(selectedIndex - 1));
  next.addEventListener('click', () => selectProduct(selectedIndex + 1));
  selectProduct(0);

  stage.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    list.querySelectorAll('.presshotspots-item[data-open="true"]').forEach((item) => {
      item.dataset.open = 'false';
      item.querySelector('.presshotspots-trigger')?.setAttribute('aria-expanded', 'false');
      item.querySelector('.presshotspots-trigger')?.focus();
    });
  });
  block.replaceChildren(viewport, mobilePanel, mobileNav);
}
