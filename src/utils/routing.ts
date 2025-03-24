import type { PageDefinition, RouteDefinition } from '@Types';

/**
 * Constants for route handling.
 */
export const ROUTE_CONSTANTS = {
    SUPPORTED_PAGE_EXTENSIONS: ['.tsx', '.html'],
    PAGE_INDEX_FILES: ['index.tsx', 'index.html'],
    DYNAMIC_SEGMENT_PREFIX: ':',
    DYNAMIC_FOLDER_START: '[',
    DYNAMIC_FOLDER_END: ']',
    GROUPING_FOLDER_START: '(',
    GROUPING_FOLDER_END: ')',
};

/**
 * Supported HTTP methods
 */
export const HTTP_METHODS = [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
    'HEAD',
    'OPTIONS',
];

/**
 * Calculates the specificity of a route path based on the number of static segments.
 * Static segments increase the score, while dynamic segments (:param) do not.
 * @param path The route path to evaluate.
 * @returns The specificity score (higher means more static segments).
 */
export const getRouteSpecificity = (path: string): number => {
    const segments = path.split('/').filter(Boolean);
    return segments.reduce((score, segment) => {
        return segment.startsWith(ROUTE_CONSTANTS.DYNAMIC_SEGMENT_PREFIX)
            ? score
            : score + 1;
    }, 0);
};

/**
 * Compares two routes for sorting, prioritizing those with higher specificity (more static segments).
 * If specificity is equal, sorts alphabetically by path.
 * @param a The first route to compare.
 * @param b The second route to compare.
 * @returns Negative if a comes before b, positive if b comes before a, zero if equal.
 */
export const compareRoutes = (
    a: PageDefinition | RouteDefinition,
    b: PageDefinition | RouteDefinition
): number => {
    const aSpecificity = getRouteSpecificity(a.path);
    const bSpecificity = getRouteSpecificity(b.path);

    if (aSpecificity > bSpecificity) return -1;
    if (aSpecificity < bSpecificity) return 1;
    return a.path.localeCompare(b.path);
};
