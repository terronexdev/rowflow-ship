# Logging Migration Guide

This guide explains how to replace `console.log`, `console.error`, and `console.warn` statements with structured logging using Pino.

## Why Migrate?

- **Structured data**: Logs include context and metadata for better debugging
- **Performance**: Pino is one of the fastest Node.js loggers
- **Production-ready**: JSON logs in production are easily parsed by log aggregators
- **Log levels**: Control verbosity with environment variables
- **Searchable**: Structured logs make it easy to search and filter

## Import the Logger

Add this import at the top of any file that needs logging:

```typescript
import { log } from '@/lib/logger';
```

## Migration Patterns

### 1. Simple console.log → log.debug or log.info

**Before:**
```typescript
console.log('User logged in');
```

**After:**
```typescript
log.info('User logged in', { userId: user.id });
```

**When to use:**
- Use `log.debug()` for development/debugging information
- Use `log.info()` for general application information

### 2. console.error → log.error

**Before:**
```typescript
console.error('Database error:', error);
```

**After:**
```typescript
log.error('Database operation failed', error, {
  operation: 'updateUser',
  userId: user.id,
});
```

**Pattern:**
```typescript
log.error(
  'Human-readable message',  // What failed
  error,                      // The Error object
  { /* additional context */ } // Optional metadata
);
```

### 3. console.warn → log.warn

**Before:**
```typescript
console.warn('Rate limit approaching');
```

**After:**
```typescript
log.warn('Rate limit approaching', {
  remaining: 10,
  userId: user.id,
});
```

### 4. Development Debug Logs

**Before:**
```typescript
console.log('Received data:', data);
console.log('Validated data:', data);
```

**After:**
```typescript
log.debug('Processing request data', {
  hasData: !!data,
  fieldCount: Object.keys(data).length,
});
```

**Note**: Don't log entire objects in production. Log metadata about them instead.

### 5. API Request/Response Logging

**For API routes**, use specialized logging helpers:

```typescript
// Request received
log.apiRequest('POST', '/api/projects', {
  userId: session.user.id,
});

// Response sent
log.apiResponse('POST', '/api/projects', 201, duration, {
  projectId: project.id,
});
```

### 6. Authentication Events

```typescript
log.authEvent('login_success', user.id, {
  provider: 'google',
});

log.authEvent('login_failed', undefined, {
  email: email,
  reason: 'invalid_password',
});
```

### 7. Payment Events

```typescript
log.paymentEvent('checkout_completed', customerId, {
  amount: 2900,
  tier: 'BASIC',
});
```

## Files Requiring Migration

Run this command to find all remaining console statements:

```bash
grep -r "console\.\(log\|error\|warn\|info\|debug\)" src/
```

### Current Status

**✅ Migrated:**
- `src/app/api/auth/register/route.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `src/app/api/projects/route.ts`

**⏳ Remaining (15 files):**
- `src/app/(dashboard)/projects/[id]/import/page.tsx`
- `src/app/(dashboard)/projects/[id]/parcels/[parcelId]/edit/page.tsx`
- `src/app/(dashboard)/projects/[id]/parcels/new/page.tsx`
- `src/app/(dashboard)/projects/new/page.tsx`
- `src/app/api/import/parcels/route.ts`
- `src/app/api/parcels/[id]/route.ts`
- `src/app/api/parcels/route.ts`
- `src/app/api/projects/[id]/export/route.ts`
- `src/app/api/projects/[id]/route.ts`
- `src/app/api/projects/[id]/stats/route.ts`
- `src/app/api/stripe/checkout/route.ts`
- `src/app/api/stripe/portal/route.ts`
- `src/components/map/ParcelMap.tsx`
- `src/lib/auth.ts`

## Best Practices

### DO ✅

1. **Add context to logs:**
   ```typescript
   log.error('Failed to update parcel', error, {
     parcelId: parcel.id,
     projectId: project.id,
     userId: session.user.id,
   });
   ```

2. **Use appropriate log levels:**
   - `debug`: Development info (will be filtered out in production)
   - `info`: General application events
   - `warn`: Warnings that should be investigated
   - `error`: Errors that need attention

3. **Log errors with full context:**
   ```typescript
   try {
     // ...
   } catch (error) {
     log.error('Operation failed', error, { context: 'additional info' });
   }
   ```

### DON'T ❌

1. **Don't log sensitive data:**
   ```typescript
   // ❌ Bad
   log.info('User registered', { password: user.password });

   // ✅ Good
   log.info('User registered', { userId: user.id, email: user.email });
   ```

2. **Don't log entire request/response objects:**
   ```typescript
   // ❌ Bad
   log.debug('Request received', { body: req.body });

   // ✅ Good
   log.debug('Request received', {
     hasBody: !!req.body,
     fields: Object.keys(req.body || {}).length,
   });
   ```

3. **Don't use console.log for production code:**
   ```typescript
   // ❌ Bad
   console.log('Processing...');

   // ✅ Good
   log.debug('Processing request', { stage: 'validation' });
   ```

## Complete Example

### Before:

```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Creating parcel:', body);

    const parcel = await createParcel(body);
    console.log('Parcel created:', parcel.id);

    return NextResponse.json({ parcel });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### After:

```typescript
import { log } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    log.debug('Creating new parcel', {
      projectId: body.projectId,
      hasGeometry: !!body.geometry,
    });

    const parcel = await createParcel(body);
    log.info('Parcel created successfully', {
      parcelId: parcel.id,
      projectId: parcel.projectId,
    });

    return NextResponse.json({ parcel });
  } catch (error) {
    log.error('Failed to create parcel', error, {
      projectId: body?.projectId,
    });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

## Testing Logs

### Development

Logs will be pretty-printed in development:

```
[INFO] User logged in
  userId: "clx123..."
  email: "user@example.com"
```

### Production

Logs will be JSON for easy parsing:

```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00.000Z",
  "msg": "User logged in",
  "userId": "clx123...",
  "email": "user@example.com"
}
```

### Changing Log Level

Set the `LOG_LEVEL` environment variable:

```bash
# Development: see debug logs
LOG_LEVEL=debug pnpm dev

# Production: info and above
LOG_LEVEL=info pnpm start

# Only errors
LOG_LEVEL=error pnpm start
```

## Next Steps

1. Migrate remaining API routes (highest priority)
2. Migrate UI components (lower priority, as they run in browser)
3. Remove all `console.*` calls
4. Add ESLint rule to prevent future console usage:

```javascript
// .eslintrc.js
rules: {
  'no-console': 'error',
}
```

## Questions?

- **What level should I use?** See "Best Practices" above
- **Can I still use console in development?** No, use `log.debug()` instead
- **How do I view logs in production?** Configure your hosting platform to collect logs from stdout
