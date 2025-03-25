import { authGuard } from '@guards';
import { loggerMiddleware, validationMiddleware } from '@middleware';

// Route config with guards and middleware
export const config = {
  guards: [authGuard],
  middleware: [loggerMiddleware]
};

// HTTP handlers
export async function GET(req, res) {
  return res.json({ message: "Users list" });
}

////////////////////////////////////////////////////

import { roleGuard } from '@guards';
import { cacheMiddleware, validationMiddleware } from '@middleware';

// Route config with configurable guards and middleware
export const config = {
  guards: {
    role: {
      handler: roleGuard,
      options: {
        requiredRoles: ['admin', 'super-admin'],
        failureRedirect: '/unauthorized'
      }
    }
  },
  middleware: {
    cache: {
      handler: cacheMiddleware,
      options: {
        ttl: 60, // Cache for 60 seconds
        maxSize: 100 // Max 100 items in cache
      }
    },
    validation: {
      handler: validationMiddleware,
      options: {
        schema: {
          // Your validation schema
        }
      }
    }
  }
};

export async function GET(req, res) {
  return res.json({ message: "Admin settings" });
}


/////////////////////////////////////////////////////////////

import { loggerMiddleware } from '@middleware';

// Legacy middleware array is still supported
export const middleware = [loggerMiddleware];

export async function GET(req, res) {
  return res.json({ message: "Products list" });
}