/** Split an href into path + optional hash segment. */
export function parseHashHref(href: string): { path: string; hash: string | null } {
  const hashIndex = href.indexOf('#');
  if (hashIndex === -1) return { path: href, hash: null };
  return {
    path: href.slice(0, hashIndex) || '/',
    hash: href.slice(hashIndex + 1) || null,
  };
}

function pathnameMatchesNavPath(
  pathname: string,
  path: string,
  exactRoots: readonly string[] = [],
): boolean {
  if (exactRoots.includes(path)) return pathname === path;
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** Whether `pathname` matches the path portion of a nav href. */
export function pathnameMatchesNavHref(
  pathname: string,
  href: string,
  exactRoots: readonly string[] = [],
): boolean {
  const { path } = parseHashHref(href);
  return pathnameMatchesNavPath(pathname, path, exactRoots);
}

function isMoreSpecificNavHref(candidate: string, current: string): boolean {
  const { path: candidatePath } = parseHashHref(candidate);
  const { path: currentPath } = parseHashHref(current);
  if (candidatePath === currentPath) return false;
  return candidatePath.startsWith(
    currentPath.endsWith('/') ? currentPath : `${currentPath}/`,
  );
}

/**
 * Path-only nav active check with longest-prefix-wins among siblings.
 * Pass `exactRoots` for items like `/admin` that must not match child routes.
 */
export function isPathNavLinkActive(
  pathname: string,
  href: string,
  allHrefs: readonly string[],
  exactRoots: readonly string[] = [],
): boolean {
  if (!pathnameMatchesNavHref(pathname, href, exactRoots)) return false;

  return !allHrefs.some(
    (other) =>
      other !== href &&
      pathnameMatchesNavHref(pathname, other, exactRoots) &&
      isMoreSpecificNavHref(other, href),
  );
}

/**
 * Hash-aware nav active check.
 * `currentHash` is the location hash without the leading `#` (empty when none).
 */
export function isHashNavLinkActive(
  pathname: string,
  href: string,
  currentHash: string,
  siblingHrefs: readonly string[],
  exactRoots: readonly string[] = [],
): boolean {
  const { path, hash } = parseHashHref(href);
  const normalizedHash = currentHash.replace(/^#/, '');

  if (!pathnameMatchesNavPath(pathname, path, exactRoots)) {
    return false;
  }

  if (hash) {
    return normalizedHash === hash;
  }

  const siblingHashMatches = siblingHrefs.some((link) => {
    const sibling = parseHashHref(link);
    return sibling.path === path && sibling.hash !== null && sibling.hash === normalizedHash;
  });

  return !siblingHashMatches;
}

/** When already on `pathname`, return the hash id to scroll to (same-page anchor). */
export function getSamePageHash(pathname: string, href: string): string | null {
  const { path, hash } = parseHashHref(href);
  if (!hash) return null;
  if (!pathnameMatchesNavPath(pathname, path)) return null;
  return hash;
}
