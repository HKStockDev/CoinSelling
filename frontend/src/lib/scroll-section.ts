export const HOME_SCROLL_KEY = 'homeScrollSection';

export function scrollToSection(
  id: string,
  behavior: ScrollBehavior = 'smooth',
) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior, block: 'start' });
  return true;
}

export function keepCleanHomeUrl() {
  if (typeof window === 'undefined') return;
  const clean = window.location.pathname + window.location.search;
  if (window.location.hash || window.location.href.endsWith('#')) {
    window.history.replaceState(null, '', clean || '/');
  }
}

export function goToHomeSection(
  section: string,
  pathname: string,
  push: (href: string) => void,
) {
  if (pathname === '/') {
    scrollToSection(section);
    window.history.replaceState(null, '', '/');
    return;
  }
  sessionStorage.setItem(HOME_SCROLL_KEY, section);
  push('/');
}

export function consumeHomeScrollSection(): string | null {
  try {
    const section = sessionStorage.getItem(HOME_SCROLL_KEY);
    if (section) sessionStorage.removeItem(HOME_SCROLL_KEY);
    return section;
  } catch {
    return null;
  }
}
