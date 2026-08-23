/**
 * The nav is two words: "communities" and "drawer". Everything else —
 * the avenues, the reaching place — folds into the drawer, a quiet
 * slide-in panel on the right.
 */
export interface DrawerItem {
  label: string;
  href: string;
}

export function buildNav(communitiesHref: string, items: DrawerItem[]): void {
  const ways = document.getElementById('ways');
  if (!ways) return;
  ways.replaceChildren();

  const communities = document.createElement('a');
  communities.href = communitiesHref;
  communities.textContent = 'communities';
  ways.appendChild(communities);

  const drawerBtn = document.createElement('button');
  drawerBtn.type = 'button';
  drawerBtn.id = 'drawer-open';
  drawerBtn.className = 'nav-drawer-btn';
  drawerBtn.textContent = 'drawer';
  drawerBtn.setAttribute('aria-expanded', 'false');
  ways.appendChild(drawerBtn);

  let panel: HTMLElement | null = null;

  const closeDrawer = () => {
    panel?.classList.remove('is-open');
    drawerBtn.setAttribute('aria-expanded', 'false');
    window.setTimeout(() => {
      panel?.remove();
      panel = null;
    }, 400);
  };

  const openDrawer = () => {
    panel = document.createElement('aside');
    panel.className = 'drawer';
    panel.setAttribute('aria-label', 'All the ways through');
    const head = document.createElement('div');
    head.className = 'drawer-head';
    const title = document.createElement('span');
    title.textContent = 'the ways through';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn btn--ghost';
    closeBtn.textContent = 'close';
    closeBtn.addEventListener('click', closeDrawer);
    head.append(title, closeBtn);

    const list = document.createElement('nav');
    list.className = 'drawer-list';
    for (const item of items) {
      const a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
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
