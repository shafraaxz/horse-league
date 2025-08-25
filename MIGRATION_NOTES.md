# CRA → Next.js Migration (with API routes)

- All server endpoints from `/api` moved to Next.js at `/pages/api`.
- Database utilities remain under `pages/api/_lib` (mongodb.js, models, middleware, utils).
- Frontend `src/components` → `/components`, `src/hooks` → `/hooks`, `src/index.css` → `/styles/globals.css`.
- Tailwind content paths updated for Next.js.
- `jsconfig.json` provides `@/` alias to project root.
- Replace any `REACT_APP_...` env usage on the client with `NEXT_PUBLIC_...`.

## Running locally
```bash
npm i
npm run dev
```

## Environment
Create `.env.local` and include:
```
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_API_BASE_URL=/api
```
