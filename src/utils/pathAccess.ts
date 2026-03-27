import routes from '../../config/routes';

type AccessMap = Record<string, unknown>;

type RouteNode = {
  path?: string;
  access?: string;
  routes?: RouteNode[];
};

type RouteAccessEntry = {
  path: string;
  access?: string;
  regex: RegExp;
};

const ALWAYS_ACCESSIBLE_PREFIXES = ['/guide', '/account'];
const ALWAYS_ACCESSIBLE_PATHS = new Set(['/', '/workbench', '/no-tenant']);

function pathToRegex(path: string): RegExp {
  const escaped = path
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\/:\w+/g, '/[^/]+')
    .replace(/\/\*/g, '/.*');

  return new RegExp(`^${escaped}$`);
}

function flattenRoutes(nodes: RouteNode[], inheritedAccess?: string, collector: RouteAccessEntry[] = []): RouteAccessEntry[] {
  for (const node of nodes) {
    const nodeAccess = node.access || inheritedAccess;
    if (node.path && !node.path.includes('*') && !node.path.startsWith('/user')) {
      collector.push({
        path: node.path,
        access: nodeAccess,
        regex: pathToRegex(node.path),
      });
    }

    if (node.routes?.length) {
      flattenRoutes(node.routes, nodeAccess, collector);
    }
  }

  return collector;
}

const ROUTE_ACCESS_ENTRIES = flattenRoutes(routes as RouteNode[]).sort(
  (a, b) => b.path.length - a.path.length,
);

function canMatchAlwaysAccessiblePath(path: string): boolean {
  return ALWAYS_ACCESSIBLE_PATHS.has(path)
    || ALWAYS_ACCESSIBLE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function canAccessPath(path: string, access: AccessMap): boolean {
  if (!path) return false;

  const normalizedPath = path.split(/[?#]/)[0] || path;
  if (canMatchAlwaysAccessiblePath(normalizedPath)) {
    return true;
  }

  const matchedEntry = ROUTE_ACCESS_ENTRIES.find((entry) => entry.regex.test(normalizedPath));
  if (!matchedEntry) {
    return false;
  }

  if (!matchedEntry.access) {
    return true;
  }

  return Boolean(access[matchedEntry.access]);
}

export const __TEST_ONLY__ = {
  ROUTE_ACCESS_ENTRIES,
  pathToRegex,
};
