# lib Directory

This directory contains utility modules and helpers used throughout the application.

## Environment Variables (`env.ts`)

Type-safe environment variable management with runtime validation using Zod.

### Usage

```typescript
import { env } from '@/lib/env';

// Access environment variables with full type safety
const dbUrl = env.DATABASE_URL;
const authSecret = env.NEXTAUTH_SECRET;
const nodeEnv = env.NODE_ENV;
```

### Features

- **Type Safety**: Full TypeScript support with autocomplete
- **Runtime Validation**: Validates all required variables at startup
- **Clear Error Messages**: Detailed validation errors with helpful messages
- **Security**: Enforces minimum security requirements (e.g., NEXTAUTH_SECRET length)
- **Format Validation**: Ensures URLs are valid, database strings are correct format

### Required Environment Variables

| Variable | Type | Description | Validation |
|----------|------|-------------|------------|
| `DATABASE_URL` | string | PostgreSQL connection string | Must be valid PostgreSQL URL |
| `NEXTAUTH_URL` | string | Base URL for authentication | Must be valid URL |
| `NEXTAUTH_SECRET` | string | Secret for JWT signing | Minimum 32 characters |
| `NODE_ENV` | enum | Node environment | Must be 'development', 'production', or 'test' |

### Adding New Environment Variables

#### Server-side variables (not exposed to browser):

1. Add to `serverSchema` in `lib/env.ts`:
```typescript
const serverSchema = z.object({
  // ... existing variables
  NEW_SERVER_VAR: z.string().min(1, "NEW_SERVER_VAR is required"),
});
```

2. Add to `.env.example`:
```bash
NEW_SERVER_VAR="example-value"
```

#### Client-side variables (exposed to browser):

1. Add to `clientSchema` in `lib/env.ts`:
```typescript
const clientSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
});
```

2. Add to `.env.example`:
```bash
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

**Important**: Client-side variables must be prefixed with `NEXT_PUBLIC_`.

### Validation Behavior

- Validation runs automatically when the module is imported
- Validation occurs at:
  - Next.js build time (via `next.config.js`)
  - Application startup (when any module imports `env`)
- Invalid or missing variables will throw an error with detailed messages
- Application will not start if validation fails

### Error Example

```
❌ Invalid server environment variables:
{
  "DATABASE_URL": {
    "_errors": ["DATABASE_URL must be a valid URL"]
  },
  "NEXTAUTH_SECRET": {
    "_errors": ["NEXTAUTH_SECRET must be at least 32 characters for security"]
  }
}
```

### Testing

Environment variable validation is tested in `lib/__tests__/env.test.ts`.

Run tests:
```bash
npm test lib/__tests__/env.test.ts
```

### Reference

This implementation is inspired by the [T3 Stack](https://create.t3.gg/en/usage/env-variables) approach to environment variable management.
