# Phantom — Secret Image Messenger

## Overview

Phantom is a covert steganography-based messaging platform. Users hide encrypted secret messages inside ordinary-looking images using a proprietary pixel-scattering algorithm. Only the Phantom platform can decode the messages. Messages are one-time read: auto-deleted after the receiver confirms they've read it, and the sender gets a read receipt with exact timestamp and reading duration.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild
- **Auth**: Custom JWT (jsonwebtoken + bcryptjs) — NO Clerk
- **Frontend**: React + Vite + Tailwind v4 + shadcn/ui

## Architecture

- `artifacts/phantom/` — React + Vite frontend (dark cyber/intelligence aesthetic)
- `artifacts/api-server/` — Express 5 API server with custom JWT auth
- `lib/db/` — Drizzle ORM + PostgreSQL schema (`messages` + `users` tables)
- `lib/api-spec/` — OpenAPI spec (source of truth)
- `lib/api-client-react/` — Generated React Query hooks + `setAuthTokenGetter` for JWT
- `lib/api-zod/` — Generated Zod validation schemas

## Authentication

Custom JWT-based auth with no third-party dependency:
- `POST /api/auth/signup` — create account (bcrypt password hash, returns JWT)
- `POST /api/auth/login` — sign in (returns JWT)
- `GET /api/auth/me` — verify token + return user
- Token stored in `localStorage` as `phantom_token` (30-day expiry)
- `SESSION_SECRET` env var is used as JWT signing secret
- `setAuthTokenGetter(() => localStorage.getItem("phantom_token"))` wired in `queryClient.ts` — all API calls auto-attach the token
- Frontend: `AuthContext.tsx` + `useAuth()` hook, `ProtectedRoute` component in `App.tsx`
- No Clerk dependencies anywhere

## Key Features

1. **Custom Steganography Engine** — Proprietary pixel-scattering algorithm using XOR encryption with platform key + message ID as seed. Not standard LSB. Cannot be replicated outside the platform.
2. **Two-layer encoding** — Layer 1 embeds message UUID in first half of image bytes; Layer 2 embeds encrypted content in second half using UUID as seed.
3. **Image Generation** — Generate carrier images (solid, gradient, noise, grid, dots patterns)
4. **One-time Read** — Message content deleted from DB after receiver confirms reading
5. **Read Receipts** — Sender sees exact timestamp and reading duration in seconds
6. **Optional Lock** — Sender can require explicit approval before receiver can decode
7. **Grant/Revoke Access** — Sender can grant or revoke access to locked messages
8. **Public Decode** — `/decode` page works without an account — anyone with the carrier image can decode

## Cyber Design System

The app uses a dark intelligence/hacker aesthetic throughout:
- **Colors**: Near-black `#0a0a0f` background, neon green `hsl(142 70% 50%)` primary
- **Font**: Monospace (JetBrains Mono / ui-monospace)
- **Animations**: `.glitch-text` (PHANTOM title glitch), `.neon-pulse` (panel glow), `.flicker`, `.typewriter`, `.data-stream`, `.status-dot`, `.animate-scan-line`, `.cyber-button` shimmer
- **Matrix rain**: Falling katakana/hex characters on the landing page
- **Cyber panels**: `.cyber-panel` — dark card with neon border, top gradient accent line
- **Border crawl**: Animated gradient border on nav top edge

## Pages

- `/` — Landing page (public, matrix rain + glitch title)
- `/sign-in` — "SECURE TERMINAL ACCESS" auth page
- `/sign-up` — "OPERATOR REGISTRATION" with password strength meter
- `/dashboard` — Sent messages control center with stats
- `/compose` — Create a new secret transmission
- `/decode` — Public decode page (no login needed)
- `/scan/:id` — Receiver view

## DB Schema

- `users` table: id, email, passwordHash, displayName, createdAt, updatedAt
- `messages` table: id, senderId, senderEmail, recipientHint, messageText (nulled after read), imageData (base64 PNG), isLocked, accessGranted, isRead, readAt, readDurationSeconds, deletedMessageAt, createdAt

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Hosting (Self-deployable — no Clerk required)

Good options for free/cheap hosting since there's no Clerk dependency:
- **Railway.app** — Postgres add-on + web service, free starter tier
- **Render.com** — Free web service + managed Postgres (spins down on inactivity)
- **Fly.io** — Free allowance, persistent volumes
- **Vercel (frontend) + Railway (API + DB)** — good split option

## Important Notes

- `lib/api-zod/src/index.ts` only exports from `./generated/api` — do not add `./generated/api.schemas` back.
- `lib/api-client-react/src/index.ts` exports `setBaseUrl` and `setAuthTokenGetter` from `custom-fetch`.
- Image data is base64-encoded PNG stored in the DB.
- The steganography uses a 41-byte PNG header offset as the starting position for bit scatter.
- The platform key (SESSION_SECRET) must remain the same across deployments or old messages cannot be decoded.
