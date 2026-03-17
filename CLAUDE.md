# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ALIA is a psychological appointment booking platform ("Tu psicólogo Aliado") — a Next.js web app for scheduling therapy sessions, managing psychologist profiles, patient intake forms, and payments. The target audience is patients seeking therapy in Colombia.

## Commands

```bash
bun run dev       # Start dev server
bun run build     # Production build
bun run lint      # Biome linting
bun run format    # Biome format (auto-fix)
npx prisma migrate dev    # Run Prisma migrations
npx prisma generate       # Generate Prisma client
npx prisma studio         # Open Prisma Studio
```

Package manager is **bun** (not npm/yarn).

## Architecture

- **Framework:** Next.js 16 (App Router, RSC enabled), React 19, TypeScript 5
- **Styling:** Tailwind CSS v4 with CSS variables in oklch color space
- **Components:** shadcn/ui (base-nova style, Base UI primitives, CVA variants) in `src/components/ui/`
- **Database:** PostgreSQL via Supabase, accessed through Prisma ORM (client output: `src/generated/prisma`)
- **Auth:** better-auth with Google OAuth (patients) and credentials (admin)
- **Payments:** Wompi (Colombian payment gateway)
- **Email:** Resend + React Email (templates in `emails/`)
- **Calendar:** Google Calendar API via Service Account (FreeBusy for availability, event creation on booking)
- **Storage:** Supabase Storage — bucket `psychologist-photos` (public), bucket `documents` (private)
- **Validation:** yup with @hookform/resolvers (NOT zod)
- **Forms:** react-hook-form
- **PDF:** @react-pdf/renderer (intake form export)
- **Dates:** date-fns

### Route structure

- `/` — Landing page (hero, psychologist cards, FAQ)
- `/psicologos/[slug]` — Individual psychologist profile
- `/agendar/[psychologistSlug]` — Booking flow (select slot → auth gate → intake form → payment)
- `/agendar/pago` — Wompi checkout with coupon support
- `/agendar/resultado` — Payment result
- `/mi-cuenta` — Patient portal (profile, appointments)
- `/admin` — Dashboard (metrics, charts)
- `/admin/psicologos` — CRUD psychologists (with schedule, photo upload)
- `/admin/citas` — Appointment management (table + calendar view)
- `/admin/formularios` — Patient intake forms (view, export PDF/CSV)
- `/admin/pagos` — Transaction list
- `/admin/finanzas` — Revenue per psychologist
- `/admin/cupones` — Discount coupon management
- `/admin/login` — Admin credentials login

### Key data models (Prisma)

`Psychologist`, `Patient`, `Appointment`, `IntakeForm`, `Payment`, `Coupon`, `User`, `Session`, `Account`, `AdminUser`, `Schedule`

### Appointment flow

1. Patient selects psychologist and time slot
2. Auth gate: must sign in with Google to continue
3. Patient fills multi-step intake form (Inventario de Vida)
4. Patient pays via Wompi (with optional coupon)
5. Wompi webhook confirms payment → appointment status becomes `confirmed`
6. System creates Google Calendar event on psychologist's calendar
7. System sends confirmation email to patient + notification to psychologist
8. 24h before: reminder email via cron

Appointment states: `pending_form` → `pending_payment` → `confirmed` / `cancelled` / `completed` / `no_show`

## Key Conventions

- **Path alias:** `@/*` maps to `src/*`
- **Linter/Formatter:** Biome (not ESLint/Prettier). 2-space indent.
- **Language:** All user-facing text in Spanish. Code (variable names, comments) in English.
- **React Compiler** is enabled (`reactCompiler: true` in next.config.ts).
- **Data fetching:** Prefer Server Components and Server Actions. Use API Routes only for webhooks and external integrations.
- **Images:** Use `next/image` for all images. Psychologist photos served from Supabase Storage public URLs.

## Brand Design System

The brand manual ("Manual Agresivo - ALIA.pdf") defines a visual identity centered on calm, professionalism, and emotional wellbeing. The isotipo is a minimalist koala (symbol of containment and accompaniment).

### Visual tone

- Elegant and warm, never clinical or cold
- Soft textures (silk, paper, fabric) as background accents
- Generous whitespace, clean layouts
- Rounded but not overly playful — professional with warmth
- High contrast between text and backgrounds for readability

### Typography

Custom fonts loaded via `next/font/local` in `src/app/layout.tsx`:

| Tailwind class | Font | Use |
|---|---|---|
| `font-sans` (default) | Klein Text Book | Body text, paragraphs, UI elements |
| `font-heading` | Robecha Daniera | Page titles, section headings, emphasis text |

Capella and Nimble are **logo-only** fonts (not for UI text).

### Color palette

Defined as CSS variables in `src/app/globals.css` (oklch). Always use semantic Tailwind tokens:

| Token | Color | HEX | Use |
|---|---|---|---|
| `bg-background` | Off-white | `#F9F4EE` | Page backgrounds |
| `text-foreground` / `bg-primary` | Charcoal | `#272727` | Primary text, buttons |
| `bg-secondary` | Cream | `#DBD4C2` | Secondary backgrounds, tags |
| `bg-accent` | Rose/Salmon | `#EAACA7` | CTAs, highlights, active states |
| `bg-muted` / `border-border` | Blush | `#DBD7CE` | Borders, dividers, muted backgrounds |
| `text-muted-foreground` | Slate | `#46494F` | Secondary text, captions |
| `ring-ring` | Sand | `#DCCAB4` | Focus rings, subtle outlines |
| `bg-card` | White | `#FFFFFF` | Cards, popovers, modals |
| `bg-destructive` | Red | `#DC2626` | Errors, destructive actions only |

**Rules:**
- Never hardcode hex values — always use semantic tokens (`bg-primary`, `text-accent`, etc.)
- The rose/salmon accent (`bg-accent`) is for CTAs and interactive highlights, not for large surfaces
- Cream (`bg-secondary`) works well for section differentiation and card hover states
- The background is warm off-white, not pure white — `bg-background` for pages, `bg-card` for elevated surfaces
- Dark mode uses inverted values from the same warm palette, not generic grays

### Component styling guidelines

- **Buttons:** Primary buttons use `bg-primary text-primary-foreground` (charcoal). Accent/CTA buttons can use `bg-accent text-accent-foreground` (rose) for main conversion actions like "Agenda tu cita"
- **Cards:** `bg-card` with subtle `border-border` borders. Use `shadow-sm` for elevation, never heavy shadows
- **Inputs:** `border-input` borders with `ring-ring` focus states
- **Headings:** Always use `font-heading` class. Keep hierarchy clear (one h1 per page)
- **Spacing:** Generous padding and margins. The brand feels spacious, not cramped
- **Border radius:** Default `0.625rem` via `--radius`. Use `rounded-lg` as default for cards and containers

## Prisma

Schema at `prisma/schema.prisma`, config at `prisma.config.ts`. Datasource is PostgreSQL (Supabase). Generated client outputs to `src/generated/prisma`.

## External Services

| Service | Purpose | Env vars |
|---|---|---|
| Supabase | PostgreSQL + Storage | `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Better Auth | Authentication | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` |
| Google OAuth | Patient login | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Google Calendar | Availability + events | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` |
| Wompi | Payments | `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET` |
| Resend | Transactional email | `RESEND_API_KEY` |
