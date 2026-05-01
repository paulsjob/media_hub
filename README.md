# MEDIA LAB

MEDIA LAB is an internal political/media asset factory MVP. It demonstrates the core workflow:

Story Intake -> Template Selection -> Generate Package -> Approval Queue -> Asset Detail / Download -> Library Search

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- npm

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

On Windows PowerShell, use `npm.cmd run dev` if script execution policy blocks `npm.ps1`.

## Verify

```bash
npm.cmd run lint
npm.cmd run build
```

The app avoids `next/font/google` so production builds do not require Google Fonts network access.

## Routes

- `/` - Dashboard command center
- `/intake` - Create Story Record
- `/templates` - Template Library
- `/generate` - Generate Quote Card V.2 package
- `/approvals` - Approval Queue
- `/library` - Asset Library
- `/library/pkg-spanberger-town-hall` - Asset Detail
- `/distribution` - Distribution Planner stub
- `/performance` - Mock performance screen
- `/settings` - Brand and safety guardrails

## Data Layer

Mock domain data lives in:

- `src/lib/types.ts`
- `src/lib/mock-data.ts`
- `src/lib/media-lab-service.ts`

All app screens read through the `MediaLabRepository` interface in `media-lab-service.ts`. This keeps Supabase Postgres, Supabase Auth, Supabase Storage, and a real render worker replaceable later.

## Mocked For MVP

- Authentication and users
- Story records
- Templates
- Asset packages
- Package fields
- Render jobs
- Output files
- Captions
- Approvals
- Performance records
- Distribution planning

No real After Effects, MoDeck, Templater, OpenAI, publishing, analytics, or Supabase integration is active yet.
