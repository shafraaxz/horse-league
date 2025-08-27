// 3. middleware/rateLimiter.js - Rate limiting
// =====================================================

const requestCounts = new Map();

export const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    message = 'Too many requests, please try again later'
  } = options;

  return (handler) => {
    return async (req, res) => {
      const ip = req.headers['x-forwarded-for'] || 
                 req.connection.remoteAddress || 
                 'unknown';
      
      const key = `${ip}:${req.url}`;
      const now = Date.now();
      
      if (!requestCounts.has(key)) {
        requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      } else {
        const record = requestCounts.get(key);
        
        if (now > record.resetTime) {
          record.count = 1;
          record.resetTime = now + windowMs;
        } else {
          record.count++;
          
          if (record.count > maxRequests) {
            return res.status(429).json({
              success: false,
              message,
              retryAfter: Math.ceil((record.resetTime - now) / 1000)
            });
          }
        }
      }
      
      return handler(req, res);
    };
  };
};

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000); // Clean every minute
