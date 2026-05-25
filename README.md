# ClearUPSC

The smartest free UPSC preparation platform.

## Features

- Optional Subject Selector (no login required)
- Syllabus Tracker (requires free account)
- PYQ Practice (no login required)

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in values
3. Create a Supabase project in the Mumbai region
4. Run the SQL from `supabase/schema.sql` in your Supabase SQL editor
5. Enable Magic Link auth in Supabase Authentication settings
6. Run `npm install`
7. Run `npm run dev`

## Environment Variables

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard -> Settings -> API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard -> Settings -> API |

## Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Add environment variables in Vercel project settings
4. Deploy

## Tech Stack

Next.js 14 · TypeScript · Tailwind CSS · shadcn-style UI · Supabase
