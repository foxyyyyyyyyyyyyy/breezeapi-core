import { zodToJsonSchema } from 'zod-to-json-schema';

// Import types
import type { ApiRouter } from '@core/api-router.js';
import type { ServerOptions, TrieNode, RouteDefinition } from '@Types';

/**
 * Builds an array of OpenAPI 3.0 parameters based on the Zod schema.
 * For each property in the Zod schema, an OpenAPI parameter is constructed
 * with the same name and required flag. The schema of the parameter is set
 * to a string type.
 * @param zodSchema - The Zod schema to construct parameters from.
 * @param location - The location of the parameter. Must be either "path" or "query".
 * @returns An array of OpenAPI 3.0 parameter objects.
 */
function buildParameters(zodSchema: any, location: 'path' | 'query'): any[] {
    const parameters: any[] = [];
    if (
        zodSchema &&
        zodSchema._def &&
        typeof zodSchema._def.shape === 'function'
    ) {
        // Get the shape of the Zod schema
        const shape = zodSchema._def.shape();

        for (const key in shape) {
            // Get the definition of the field
            const fieldDef = shape[key];

            // Determine if the field is optional
            const isOptional = fieldDef._def.typeName === 'ZodOptional';

            parameters.push({
                // Set the name of the parameter
                name: key,
                // Type of the parameter path or query
                in: location,
                // Set the required flag
                required: !isOptional,
                // Set the schema type
                schema: { type: 'string' },
                // Description of the parameter
                description: `${location} parameter ${key}`,
            });
        }
    }

    return parameters;
}

/**
 * Builds a request body object for OpenAPI based on a Zod schema.
 * Converts the Zod schema into JSON schema and constructs an OpenAPI
 * requestBody object with content type "application/json".
 * @param zodSchema - The Zod schema to convert into JSON schema.
 * @returns An OpenAPI requestBody object, or undefined if no schema is provided.
 */
function buildRequestBody(zodSchema: any): any {
    if (!zodSchema) return undefined;
    const jsonSchema = zodToJsonSchema(zodSchema);
    return {
        content: {
            'application/json': {
                schema: jsonSchema,
            },
        },
        description: 'Request body',
        required: true,
    };
}

/**
 * Converts a route path from colon-based dynamic segments to OpenAPI's curly brace syntax.
 *
 * @param routePath The original route path with colon-based dynamic segments (e.g., "/user/:id").
 * @returns The converted route path with curly brace syntax (e.g., "/user/{id}").
 */
function convertPathForOpenAPI(routePath: string): string {
    // Replace occurrences of :param with {param}
    return routePath.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
}

/**
 * Collects all routes from the trie and returns them as an array of RouteDefinition objects.
 * @param node The current node in the trie.
 * @param currentPath The current path being traversed.
 * @param routes The array of collected routes.
 * @returns An array of RouteDefinition objects.
 */
function collectRoutes(
    node: TrieNode,
    currentPath: string = '',
    routes: RouteDefinition[] = []
): RouteDefinition[] {
    // If this node has a route definition, add it
    if (node.route) {
        routes.push({
            ...node.route,
            path: currentPath,
        });
    }

    // Traverse static children
    node.children.forEach((child: TrieNode, segment: string) => {
        collectRoutes(child, `${currentPath}/${segment}`, routes);
    });

    // Traverse dynamic child if exists
    if (node.paramChild) {
        const paramPath = `${currentPath}/:${node.paramChild.paramName}`;
        collectRoutes(node.paramChild, paramPath, routes);
    }

    return routes;
}

/**
 * Generates an OpenAPI 3.0 document from the router's routes and global options.
 * @param router The router instance with loaded routes.
 * @param options Global options, including OpenAPI metadata.
 * @returns The OpenAPI document as a JavaScript object.
 */
export function generateOpenAPIDocument(
    router: ApiRouter,
    options: ServerOptions
) {
    const openapiDoc = {
        openapi: '3.0.0',
        info: {
            title: options.title || 'eSportsApp API',
            description: options.description || 'eSportsApp API documentation',
            version: options.version || '1.0.0',
        },
        paths: {} as Record<string, any>,
    };

    // Collect all routes from the trie
    const routes = collectRoutes(router.routes);

    // Iterate over each route
    for (const route of routes) {
        // Convert colon-based dynamic segments to OpenAPI's {param} syntax
        const openApiPath = convertPathForOpenAPI(route.path);

        // Initialize path object if necessary
        openapiDoc.paths[openApiPath] = openapiDoc.paths[openApiPath] || {};

        // For each HTTP method in the route, add an OpenAPI operation.
        for (const method in route.handlers) {
            // Convert HTTP method to lowercase
            const lowerMethod = method.toLowerCase();

            // Use provided openapi metadata if available; else, fallback to auto-generated values.
            const methodMeta = route.openapi?.[lowerMethod] || {};

            // Generate an operationId: e.g., "get_api_product"
            const operationId =
                methodMeta.operationId ||
                `${lowerMethod}_${route.path.replace(/[\/:]/g, '_')}`;

            // Build parameters for both path and query from the schema.
            let parameters: any[] = [];
            if (route.schema && route.schema[lowerMethod]) {
                const schemaDef = route.schema[lowerMethod];
                parameters = [
                    ...buildParameters(schemaDef.params, 'path'),
                    ...buildParameters(schemaDef.query, 'query'),
                ];
            }

            // Build requestBody if a body schema exists.
            let requestBody = undefined;
            if (route.schema && route.schema[lowerMethod]?.body) {
                requestBody = buildRequestBody(route.schema[lowerMethod].body);
            }

            openapiDoc.paths[openApiPath][lowerMethod] = {
                operationId,
                summary:
                    methodMeta.summary || `Summary for ${method} ${route.path}`,
                description: methodMeta.description || '',
                tags: methodMeta.tags || [],
                deprecated: methodMeta.deprecated || false,
                parameters: parameters,
                requestBody: requestBody,
                responses: methodMeta.responses || {
                    '200': {
                        description: 'Successful response',
                    },
                },
                externalDocs: methodMeta.externalDocs || undefined,
            };
        }
    }

    return openapiDoc;
}
