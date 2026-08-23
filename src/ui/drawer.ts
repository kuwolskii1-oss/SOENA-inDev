/**
 * The nav is two words: "communities" and "drawer". Everything else —
 * the avenues, the reaching place — folds into the drawer, a quiet
 * slide-in panel on the right.
 */
import { emblemSvg, iconSvg, prefixIcon, type EmblemName, type IconName } from './icons';

export interface DrawerItem {
  label: string;
  href: string;
  /** Avenue emblem (Phosphor) or interface icon (Lucide) for the row. */
  emblem?: EmblemName;
  icon?: IconName;
}

export function buildNav(communitiesHref: string, items: DrawerItem[]): void {
  const ways = document.getElementById('ways');
  if (!ways) return;
  ways.replaceChildren();

  const communities = document.createElement('a');
  communities.href = communitiesHref;
  communities.textContent = 'communities';
  prefixIcon(communities, 'users-round');
  ways.appendChild(communities);

  const drawerBtn = document.createElement('button');
  drawerBtn.type = 'button';
  drawerBtn.id = 'drawer-open';
  drawerBtn.className = 'nav-drawer-btn';
  drawerBtn.textContent = 'drawer';
  prefixIcon(drawerBtn, 'menu');
  drawerBtn.setAttribute('aria-expanded', 'false');
  // The drawer trigger is a control, not a way: it lives with the other
  // header actions so it survives the narrow-screen rule that hides #ways
  // — otherwise phones lose every cross-page route.
  (document.querySelector('.head-actions') ?? ways).prepend(drawerBtn);

  let panel: HTMLElement | null = null;

  const closeDrawer = () => {
    // Focus would otherwise land on <body> when the panel is destroyed.
    const hadFocus = !!panel?.contains(document.activeElement);
    panel?.classList.remove('is-open');
    drawerBtn.setAttribute('aria-expanded', 'false');
    if (hadFocus) drawerBtn.focus();
    window.setTimeout(() => {
      panel?.remove();
      panel = null;
    }, 400);
  };

  const openDrawer = () => {
    panel = document.createElement('aside');
    panel.className = 'drawer';
    panel.setAttribute('aria-label', 'All the ways through');
    // Wheel inside the drawer must scroll the drawer, not the Lenis page.
    panel.setAttribute('data-lenis-prevent', '');
    const head = document.createElement('div');
    head.className = 'drawer-head';
    const title = document.createElement('span');
    title.textContent = 'the ways through';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn btn--ghost btn--icon';
    closeBtn.innerHTML = iconSvg('x', { title: 'Close the drawer' });
    closeBtn.addEventListener('click', closeDrawer);
    head.append(title, closeBtn);

    const list = document.createElement('nav');
    list.className = 'drawer-list';
    for (const item of items) {
      const a = document.createElement('a');
      a.href = item.href;
      // Emblem (or icon) then label — the mark makes each row scannable.
      a.innerHTML =
        (item.emblem ? emblemSvg(item.emblem) : item.icon ? iconSvg(item.icon) : '') +
        `<span>${item.label}</span>`;
      a.addEventListener('click', closeDrawer);
      list.appendChild(a);
    }

    panel.append(head, list);
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDrawer();
    });
    document.body.appendChild(panel);
    drawerBtn.setAttribute('aria-expanded', 'true');
    window.setTimeout(() => panel?.classList.add('is-open'), 20);
    (list.querySelector('a') as HTMLElement | null)?.focus();
  };

  drawerBtn.addEventListener('click', () => (panel ? closeDrawer() : openDrawer()));
}
