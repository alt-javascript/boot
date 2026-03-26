/**
 * AuthMiddleware — example Bearer token authentication middleware.
 *
 * Demonstrates the CDI middleware pattern: declare static __middleware = { order: N }
 * and implement handle(request, next). Works identically across all adapters
 * (Express, Fastify, Koa, Hono, Lambda, CF Workers, Azure Functions) because
 * the middleware pipeline uses a normalised request shape.
 *
 * For a real application, replace the token validation logic with JWT verification,
 * API key lookup, session validation, etc.
 *
 * Register in the CDI context:
 *   new Singleton(AuthMiddleware)
 *
 * Disable for a specific route by checking request.path:
 *   if (request.path === '/health') return next(request);
 */
export class AuthMiddleware {
  static qualifier = '@alt-javascript/example-2-1-servers-express/AuthMiddleware';

  /**
   * Runs before all other built-in middleware (order: 5, lower than RequestLoggerMiddleware's 10).
   * This ensures auth rejection is logged by RequestLoggerMiddleware as a 401.
   */
  static __middleware = { order: 5 };

  constructor() {
    this.logger = null; // autowired
    this.config = null; // autowired
  }

  init() {
    this.logger?.debug('AuthMiddleware initialised');
  }

  /**
   * Validate the Authorization: Bearer <token> header.
   * Public routes (/health, /) skip authentication.
   *
   * @param {object} request — normalised CDI middleware request
   * @param {Function} next — continue the pipeline (optionally pass a modified request)
   * @returns {Promise<object>} pipeline result
   */
  async handle(request, next) {
    // Public routes — skip auth
    if (request.path === '/' || request.path === '/health') {
      return next(request);
    }

    const authHeader = request.headers?.authorization || request.headers?.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger?.verbose(`AuthMiddleware: rejected ${request.method} ${request.path} — no token`);
      return {
        statusCode: 401,
        body: { error: 'Unauthorized', hint: 'Provide Authorization: Bearer <token>' },
      };
    }

    const token = authHeader.slice(7);

    // --- Token validation ---
    // In production: verify JWT signature, check expiry, look up API key, etc.
    // Here we accept any non-empty token as valid for demonstration.
    if (!token) {
      return {
        statusCode: 401,
        body: { error: 'Unauthorized', hint: 'Token is empty' },
      };
    }

    // Attach user info to the request for downstream middleware and handlers
    return next({
      ...request,
      user: { token, authenticated: true },
    });
  }
}
