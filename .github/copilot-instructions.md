# NextApp - Next.js Chart Demo Application

NextApp is a Next.js 15.5.4 web application that displays interactive charts using Chart.js and React. It features a sample data visualization with the ability to add new data points, client-side SWR for data fetching with optimistic updates, global toast notifications, and a simple in-memory rate limiter.

**ALWAYS reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap and Setup

- Install dependencies: `npm install` — takes 27 seconds, NEVER CANCEL, set timeout to 60+ seconds
- All commands should be run from the repository root: `/home/runner/work/NextApp/NextApp`

### Build and Test

- Build the application: `npm run build` — takes 21 seconds, NEVER CANCEL, set timeout to 60+ seconds
- Run tests: `npm test -- --runInBand` — takes 3 seconds, set timeout to 30+ seconds
- Run linting: `npm run lint` — takes 2 seconds, set timeout to 30+ seconds
- Run type checking: `npm run typecheck` — takes 3 seconds, set timeout to 30+ seconds
- Format code: `npm run format` — takes 1 second, set timeout to 30+ seconds

### Development Server

- Start development server: `npm run dev` — starts in 1.4 seconds, serves at http://localhost:3000
- **ALWAYS use development mode for testing changes** — uses in-memory data store
- Development server automatically recompiles on file changes

### Production Server

- Start production server: `npm run start` — requires `npm run build` first, starts in 0.4 seconds
- **Production mode expects PostgreSQL database** — will show errors without DATABASE_URL configured
- For production with Postgres, create `.env.local` with: `NODE_ENV=production` and `DATABASE_URL=postgres://user:pass@localhost:5432/dbname`

## Validation

### Manual Testing Requirements

**ALWAYS manually validate any changes by running through complete user scenarios:**

1. **Standard workflow validation**:
   - Start development server: `npm run dev`
   - Navigate to http://localhost:3000
   - Verify chart displays with initial data (Jan-Jun sample data)
   - Test adding new data point: enter label (e.g., "Jul") and value (e.g., "55")
   - Click "Add" button and verify:
     - Success toast appears temporarily: "Point created"
     - Chart updates to include new data point  
     - Form fields clear after successful submission
     - Server logs show: POST request, database insert, and data refetch

2. **Error handling validation**:
   - Test with invalid input (empty fields, non-numeric values)
   - Verify appropriate error messages appear

3. **Pre-commit validation**:
   - **ALWAYS run these commands before committing any changes:**
     - `npm run format` — formats code
     - `npm run lint` — checks for linting errors
     - `npm run typecheck` — validates TypeScript types
     - `npm test -- --runInBand` — runs full test suite

### Performance and Timeout Guidelines

- **npm install**: 27 seconds — set timeout to 60+ seconds, NEVER CANCEL
- **npm run build**: 21 seconds — set timeout to 60+ seconds, NEVER CANCEL
- **npm test**: 3 seconds — set timeout to 30+ seconds
- **npm run lint**: 2 seconds — set timeout to 30+ seconds
- **npm run typecheck**: 3 seconds — set timeout to 30+ seconds
- **npm run dev**: 1.4 seconds startup — set timeout to 30+ seconds

## Project Structure

### Key Directories

- `app/` — Next.js app router pages and API routes
  - `app/page.tsx` — Main page component
  - `app/api/sample/route.ts` — REST API for sample data (GET/POST)
- `components/` — Reusable React components
  - `components/ChartDemo.tsx` — Main chart component with form
  - `components/Toast.tsx` — Global toast notification system
- `lib/` — Utilities and shared logic
  - `lib/fetcher.ts` — SWR data fetcher with retry logic
  - `lib/config.ts` — Environment-based configuration
  - `lib/data.ts` — Sample data definitions
- `server/` — Server-side helpers
  - `server/db.ts` — Database abstraction (in-memory vs Postgres)
  - `server/rateLimiter.ts` — Simple IP-based rate limiting
- `tests/` — Jest + Testing Library tests (10 test cases)

### Configuration Files

- `package.json` — Dependencies and npm scripts
- `next.config.js` — Next.js configuration
- `tsconfig.json` — TypeScript configuration
- `jest.config.js` — Jest test configuration
- `.eslintrc.json` — ESLint linting rules
- `.prettierrc` — Prettier formatting rules

## Common Development Tasks

### Adding New Features

1. **API changes**: Modify `app/api/sample/route.ts` for REST endpoints
2. **UI changes**: Edit `components/ChartDemo.tsx` for chart functionality
3. **Data layer**: Update `server/db.ts` for database operations
4. **Testing**: Add tests in `tests/` directory following existing patterns

### Database Development

- **Development**: Uses in-memory store automatically (see `lib/config.ts`)
- **Production**: Requires PostgreSQL with `DATABASE_URL` environment variable
- **Testing**: All tests use mocked database layer, no live database required

### Styling and UI

- Global styles in `app/globals.css`
- Component-specific styles use CSS modules pattern
- Chart styling uses Chart.js configuration

### Data Flow

1. Frontend form in `ChartDemo.tsx` sends POST to `/api/sample`
2. API route in `app/api/sample/route.ts` validates and processes request
3. Database layer in `server/db.ts` handles data persistence
4. SWR in `lib/fetcher.ts` manages client-side data fetching and caching
5. Toast notifications in `components/Toast.tsx` provide user feedback

## Troubleshooting

### Common Issues

1. **"Failed to load data" error**:
   - In development: Check if dev server is running
   - In production: Verify DATABASE_URL is configured and Postgres is running

2. **Build failures**:
   - Run `npm run typecheck` to identify TypeScript errors
   - Run `npm run lint` to identify linting issues

3. **Test failures**:
   - Tests run with `--runInBand` to avoid concurrency issues
   - All tests use mocked database layer

### Development Tips

- **Always use development server** (`npm run dev`) for local development
- **Check browser console** for client-side errors and network requests
- **Monitor server logs** in terminal for API request debugging
- **Rate limiting**: POST endpoint has 10 requests per minute per IP limit

## Quick Reference Commands

```bash
# Setup
npm install

# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server

# Quality checks (run before committing)
npm run format                 # Format code
npm run lint                   # Check linting
npm run typecheck             # Check TypeScript
npm test -- --runInBand      # Run tests

# URLs
# Development: http://localhost:3000
# API endpoint: http://localhost:3000/api/sample
```

## Technologies Used

- **Next.js 15.5.4** — React framework with app router
- **React 18** — UI library
- **TypeScript 5** — Type safety
- **Chart.js 4** — Chart rendering
- **SWR 2.3** — Data fetching and caching
- **Jest** — Testing framework with 10 test cases
- **PostgreSQL** — Production database (optional, uses in-memory store in development)
- **Node.js 20** — Runtime environment
