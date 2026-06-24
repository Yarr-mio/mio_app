import type { AuthRoute } from '@/constants/routes';

function routeToSegments(route: AuthRoute): string[] {
  return route.split('/').filter((segment) => segment.length > 0);
}

function stripGroupSegments(route: AuthRoute): string {
  const withoutGroups = route.replace(/\/\([^)]+\)/g, '');
  return withoutGroups === '' ? '/' : withoutGroups;
}

function normalizePath(path: string): string {
  if (path.length === 0) {
    return '/';
  }

  return path.startsWith('/') ? path : `/${path}`;
}

export function isCurrentAuthRoute(
  segments: readonly string[],
  pathname: string,
  route: AuthRoute
): boolean {
  const targetSegments = routeToSegments(route);
  const hasSegmentMatch =
    segments.length === targetSegments.length &&
    targetSegments.every((segment, index) => segments[index] === segment);

  if (hasSegmentMatch) {
    return true;
  }

  const normalizedPathname = normalizePath(pathname);
  const normalizedRoute = normalizePath(route);
  const routeWithoutGroups = normalizePath(stripGroupSegments(route));

  return normalizedPathname === normalizedRoute || normalizedPathname === routeWithoutGroups;
}
