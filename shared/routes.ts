import { z } from 'zod';
import { insertUserSchema, insertSafetyZoneSchema, insertSafeStopSchema, users, safetyZones, safeStops } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema.extend({
        confirmPassword: z.string(),
      }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      }),
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        username: z.string(), // passport-local uses 'username' field usually, but we map to email
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    updateProfile: {
      method: 'PATCH' as const,
      path: '/api/user',
      input: insertUserSchema.partial().omit({ password: true }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  safety: {
    zones: {
      method: 'GET' as const,
      path: '/api/safety/zones',
      input: z.object({
        lat: z.coerce.number().optional(),
        lng: z.coerce.number().optional(),
        radius: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof safetyZones.$inferSelect>()),
      },
    },
    reportZone: {
      method: 'POST' as const,
      path: '/api/safety/zones',
      input: z.object({
        lat: z.number(),
        lng: z.number(),
        radius: z.number(),
        riskLevel: z.string(),
        description: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof safetyZones.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    stops: {
      method: 'GET' as const,
      path: '/api/safety/stops',
      input: z.object({
        lat: z.coerce.number(),
        lng: z.coerce.number(),
        radius: z.coerce.number().optional().default(5000), // 5km default
      }).optional(), // Make it optional to avoid breaking existing calls immediately, though we will pass it
      responses: {
        200: z.array(z.custom<typeof safeStops.$inferSelect>()),
      },
    },
    sos: {
      method: 'POST' as const,
      path: '/api/safety/sos',
      input: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      responses: {
        200: z.object({
          message: z.string(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  navigation: {
    route: {
      method: 'POST' as const,
      path: '/api/navigation/route',
      input: z.object({
        startLat: z.number(),
        startLng: z.number(),
        endLat: z.number(),
        endLng: z.number(),
      }),
      responses: {
        200: z.object({
          routes: z.array(
            z.object({
              path: z.array(z.tuple([z.number(), z.number()])), // [[lat, lng], ...]
              riskScore: z.number(),
              category: z.string(), // 'safe', 'moderate', 'unsafe'
              distance: z.string(),
              duration: z.string(),
              geometry: z.any(),
              steps: z.array(z.any()).optional(),
            })
          ),
        }),
      },
    },
  },
};
