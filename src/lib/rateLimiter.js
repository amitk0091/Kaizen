const requests = new Map();

const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function createRateLimiter(limit = DEFAULT_LIMIT, windowMs = DEFAULT_WINDOW_MS) {
  return function rateLimiter(key) {
    const now = Date.now();
    let data = requests.get(key);

    if (!data || now - data.resetTime > windowMs) {
      data = { count: 0, resetTime: now };
      requests.set(key, data);
    }

    data.count++;

    if (data.count > limit) {
      const retryAfter = Math.ceil((data.resetTime + windowMs - now) / 1000);
      const error = new Error('Too many requests');
      error.status = 429;
      error.retryAfter = retryAfter;
      throw error;
    }

    return { allowed: true, remaining: limit - data.count };
  };
}

export const passwordResetLimiter = createRateLimiter(3, 60 * 60 * 1000); // 3 per hour
export const signupLimiter = createRateLimiter(5, 60 * 60 * 1000); // 5 per hour
export const loginLimiter = createRateLimiter(10, 15 * 60 * 1000); // 10 per 15 min
