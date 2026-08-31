import { NextResponse } from 'next/server';

export class APIError extends Error {
  constructor(message, status = 500, code = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'APIError';
  }
}

export function badRequest(message, code = null) {
  return new APIError(message, 400, code);
}

export function unauthorized(message = 'Unauthorized') {
  return new APIError(message, 401);
}

export function forbidden(message = 'Forbidden') {
  return new APIError(message, 403);
}

export function notFound(message = 'Not found') {
  return new APIError(message, 404);
}

export function conflict(message = 'Conflict') {
  return new APIError(message, 409);
}

export function tooManyRequests(message = 'Too many requests', retryAfter = 60) {
  const error = new APIError(message, 429);
  error.retryAfter = retryAfter;
  return error;
}

export function internalError(message = 'Internal server error') {
  return new APIError(message, 500);
}

export function jsonResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(error, status = 500) {
  if (error instanceof APIError) {
    const response = NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
    if (error.retryAfter) {
      response.headers.set('Retry-After', String(error.retryAfter));
    }
    return response;
  }

  console.error('Unhandled error:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export function handleAPIError(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
