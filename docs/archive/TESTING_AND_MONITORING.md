# Testing and Monitoring Setup

This document describes the testing infrastructure and monitoring setup for the ROW Tracking application.

## Testing

### Test Framework

We use **Jest** with **React Testing Library** for unit and integration testing.

### Running Tests

```bash
# Run tests in watch mode (for development)
pnpm test

# Run tests once with coverage (for CI)
pnpm test:ci

# Run tests with coverage report
pnpm test:coverage
```

### Test Structure

Tests are located in `__tests__` directories adjacent to the code they test:

```
src/
  lib/
    utils.ts
    __tests__/
      utils.test.ts
  components/
    MyComponent.tsx
    __tests__/
      MyComponent.test.tsx
```

### Writing Tests

Example test file:

```typescript
import { formatDate } from '../utils';

describe('formatDate', () => {
  it('should format dates correctly', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toContain('Jan');
  });
});
```

### Coverage Goals

Current thresholds (will increase over time):
- Statements: 10%
- Branches: 10%
- Functions: 10%
- Lines: 10%

Target thresholds:
- Statements: 80%
- Branches: 70%
- Functions: 80%
- Lines: 80%

## Logging

### Structured Logging with Pino

We use **Pino** for structured, high-performance logging.

#### Usage

```typescript
import { log } from '@/lib/logger';

// Basic logging
log.info('User logged in', { userId: '123' });
log.error('Database connection failed', error, { context: 'auth' });
log.warn('Rate limit approaching', { remaining: 10 });
log.debug('Processing request', { path: '/api/users' });

// Specialized logging
log.apiRequest('GET', '/api/projects');
log.apiResponse('GET', '/api/projects', 200, 150);
log.authEvent('login', 'user-123');
log.paymentEvent('checkout', 'cus-123');
```

#### Log Levels

- `debug`: Detailed debugging information (dev only)
- `info`: General application information
- `warn`: Warning messages
- `error`: Error messages

#### Configuration

Set the log level via environment variable:

```bash
LOG_LEVEL=debug  # Options: debug, info, warn, error
```

In production, logs are output as JSON for easy parsing by log aggregation tools.

## Error Monitoring

### Sentry Integration

We use **Sentry** for error tracking and performance monitoring.

#### Setup

1. Create a Sentry account at https://sentry.io/
2. Create a new Next.js project
3. Copy your DSN (Data Source Name)
4. Add to your `.env` file:

```bash
SENTRY_DSN="https://your-key@sentry.io/your-project-id"
NEXT_PUBLIC_SENTRY_DSN="https://your-key@sentry.io/your-project-id"
```

#### What's Tracked

- **Client-side errors**: JavaScript errors in the browser
- **Server-side errors**: API route errors and server-side exceptions
- **Performance**: Page load times and API response times
- **Session Replay**: Record user sessions for debugging (errors only)

#### Manual Error Reporting

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  // Your code
} catch (error) {
  Sentry.captureException(error, {
    tags: { section: 'payment' },
    extra: { userId: '123' }
  });
}
```

#### Filtering Errors

Development errors are filtered out. Configure additional filters in:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

## CI/CD Pipeline

### GitHub Actions

We use **GitHub Actions** for continuous integration.

#### Workflow Jobs

1. **Lint**: Runs ESLint to check code quality
2. **Test**: Runs Jest tests with coverage
3. **Type Check**: Runs TypeScript compiler
4. **Build**: Builds the application

#### Triggers

The CI pipeline runs on:
- Push to `main` branch
- Push to `claude/**` branches
- Pull requests to `main`

#### Configuration

See `.github/workflows/ci.yml` for full configuration.

#### Status Badges

Add to your README:

```markdown
![CI](https://github.com/your-username/row-tracking-improved/workflows/CI/badge.svg)
```

## Best Practices

### Testing

1. **Test behavior, not implementation**: Focus on what the code does, not how
2. **Use descriptive test names**: `it('should format currency with comma separators')`
3. **Arrange, Act, Assert**: Structure tests clearly
4. **Mock external dependencies**: Database, APIs, etc.
5. **Test edge cases**: Empty inputs, null values, errors

### Logging

1. **Use structured logging**: Always pass objects with context
2. **Don't log sensitive data**: No passwords, tokens, or PII
3. **Use appropriate levels**: Debug for development, info for production
4. **Include correlation IDs**: For tracing requests across services
5. **Log errors with context**: Include what operation failed and why

### Error Monitoring

1. **Add context to errors**: User ID, action being performed
2. **Use breadcrumbs**: Track user actions leading to errors
3. **Set up alerts**: Get notified of critical errors
4. **Review errors regularly**: Fix recurring issues
5. **Use source maps**: Sentry needs them to show readable stack traces

## Troubleshooting

### Tests Failing

```bash
# Clear Jest cache
pnpm test --clearCache

# Run specific test file
pnpm test utils.test.ts

# Run tests in verbose mode
pnpm test --verbose
```

### Sentry Not Working

1. Check DSN is set correctly in environment variables
2. Verify Sentry config files are imported (should be automatic)
3. Check browser console for Sentry initialization messages
4. Ensure source maps are uploaded (for production)

### CI Pipeline Failing

1. Check logs in GitHub Actions tab
2. Run the same commands locally to reproduce
3. Ensure all environment variables are set in GitHub Secrets
4. Check that dependencies are installed correctly

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Pino Documentation](https://getpino.io/)
- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
