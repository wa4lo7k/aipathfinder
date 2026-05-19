# Pathfinder AI

AI-powered career companion — personalized career guidance, job matching, roadmap generation, and skill development.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Custom CSS Variables
- **AI:** Google Gemini 2.0 Flash (primary) + Groq LLaMA 3.3 (fallback)
- **Database:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Jobs API:** RapidAPI JSearch
- **Deployment:** Vercel

## Features

- 🔍 **Job Search** — Search jobs via JSearch API with DB caching
- 🗺️ **AI Roadmap Maker** — Generate personalized career roadmaps with 7 milestones
- 🎯 **Career Path Generator** — AI-powered career recommendations based on your profile
- 🤖 **AI Chat Assistant** — Career guidance conversations with streaming responses
- 📄 **Resume Inspector** — AI-powered resume analysis (coming soon)

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your keys.
