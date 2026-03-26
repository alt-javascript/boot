/**
 * AuthMiddleware — example Bearer token authentication middleware.
 *
 * Identical logic to the Express example — demonstrates that middleware
 * written against the normalised request shape works across all adapters.
 *
 * Register in the CDI context: new Singleton(AuthMiddleware)
 */
export class AuthMiddleware {
  static qualifier = '@alt-javascript/example-3-1-serverless-lambda/AuthMiddleware';

  /** Runs before built-in middleware (order: 5 < RequestLoggerMiddleware's 10) */
  static __middleware = { order: 5 };

  constructor() {
    this.logger = null; // autowired
  }

  init() {
    this.logger?.debug('AuthMiddleware initialised');
  }

  async handle(request, next) {
    // Public routes skip auth
    if (request.path === '/health') {
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
    if (!token) {
      return { statusCode: 401, body: { error: 'Unauthorized', hint: 'Token is empty' } };
    }

    return next({ ...request, user: { token, authenticated: true } });
  }
}
