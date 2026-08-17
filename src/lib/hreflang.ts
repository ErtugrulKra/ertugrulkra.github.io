export function normalizePath(path: string): string {
  if (!path || path === '/') return '/';
  return path.replace(/\/+$/, '') || '/';
}

export function getHreflangUrls(currentPath: string, site: URL | undefined) {
  const origin = site?.origin || 'https://blog.ertugrulkara.com';
  const path = normalizePath(currentPath);

  let enPath: string;
  let trPath: string;

  if (path === '/404') {
    return {
      en: new URL('/', origin).href,
      tr: new URL('/tr', origin).href,
      xDefault: new URL('/', origin).href,
    };
  }

  if (path === '/tr' || path.startsWith('/tr/')) {
    const rest = path === '/tr' ? '/' : path.slice(3);
    enPath = rest || '/';
    trPath = path;
  } else if (path === '/en' || path.startsWith('/en/')) {
    const rest = path === '/en' ? '/' : path.slice(3);
    enPath = rest || '/';
    trPath = enPath === '/' ? '/tr' : `/tr${enPath}`;
  } else {
    enPath = path;
    trPath = path === '/' ? '/tr' : `/tr${path}`;
  }

  return {
    en: new URL(enPath, origin).href,
    tr: new URL(trPath, origin).href,
    xDefault: new URL(enPath, origin).href,
  };
}
