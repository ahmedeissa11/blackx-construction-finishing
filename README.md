# BLACK X CONSTRUCTION & FINISHING

Current implementation: a public bilingual website (Arabic RTL first, English LTR), an internal operations dashboard preview, and a client portal preview — built with Next.js 15 (App Router) and strict TypeScript. Dashboard and portal preview routes are protected by server-side Auth.js review sign-in; their business data and actions remain synthetic/simulated until an operational backend is connected.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000  → redirects to /ar
```

Quality commands:

```bash
npm run typecheck  # strict TS (incl. noUncheckedIndexedAccess)
npm run lint       # ESLint (next/core-web-vitals), zero warnings
npm run format:check
npm test           # Vitest unit/content/route tests
npm run build      # production build
```

## Architecture

| Path | Responsibility |
| --- | --- |
| `src/app/[locale]/(site)/` | Public website pages (home, about, services, projects, request, articles, contact, FAQs) |
| `src/app/[locale]/dashboard/` | Operations dashboard (overview, requests queue, 16 module patterns) |
| `src/app/[locale]/portal/` | Client portal (overview, projects, milestones, reports, documents, quotations, issues, handover, profile) |
| `src/auth.ts` · `src/auth.config.ts` · `src/app/api/auth/` | Auth.js owner-review sign-in/session handling |
| `src/app/[locale]/login/` · `src/lib/admin-auth.ts` | Localized sign-in and server-side credential/rate-limit helpers |
| `src/components/brand/` | Authentic BLACK X logo lockups |
| `src/components/site/` | Header, footer, forms, page hero, service cards |
| `src/components/dashboard/` · `src/components/portal/` | Shells, tables, request board, portal panels |
| `src/components/ui/` | Shared primitives (dialog, toast, accordion, breadcrumbs, CTA, app shell) |
| `src/config/navigation.ts` | Route/navigation configuration for all three experiences |
| `src/content/dictionary.ts` · `app-dictionary.ts` | Typed Arabic/English UI strings (parity-tested) |
| `src/content/services.ts` | Approved service catalogue (localized, no invented prices/guarantees) |
| `src/content/publications.ts` | Published projects (empty until approved), FAQs, labelled preview articles |
| `src/content/preview-*.ts` | **Synthetic** dashboard/portal demo data — never real company records |
| `src/lib/` | i18n, formatting, validation, preview submission adapter |
| `src/styles/` | Design tokens + global/site CSS using logical properties (native RTL/LTR) |
| `public/brand/` | Original supplied logo asset (unmodified) |
| `public/images/` | Illustrative architectural imagery (never presented as completed projects) |

## Honesty boundaries (frontend phase)

- **No operational business backend/database yet.** Public form submission still goes through `src/lib/preview-adapter.ts`, which simulates the round-trip and returns `mode: "preview"` references (e.g. `RQ-PREVIEW-…`). Dashboard/portal business records are synthetic and no preview action is persisted as a real business operation.
- **Protected review access.** Dashboard and portal routes are gated server-side with Auth.js for one environment-configured `owner_review` account. Configure only the variable names listed in `.env.example` (`AUTH_SECRET`, `AUTH_URL` when needed, `ADMIN_OWNER_EMAIL`, and `ADMIN_OWNER_PASSWORD_HASH`); never commit their values.
- **No invented company facts.** `publishedProjects` is empty by design → the projects page renders a deliberate empty state. Contact details (phone/email/address) are intentionally unpublished until officially approved. The two articles are explicitly labelled preview content.
- Add a real project: append one entry to `publishedProjects` with approved photos/metadata — index, detail template, sitemap and SEO pick it up automatically.
- Add/approve a service: append to `src/content/services.ts` — cards, detail pages, footer links, request-form options and sitemap update automatically.

## Brand

- Logo: `public/brand/blackx-logo.jpg` — the owner's supplied original (white artwork on baked-in dark background). Used as-is inside dark/rounded contexts; never redrawn.
- Palette: `#F4F1EC` paper · `#E3DCD1` sand · `#A39789` taupe · `#3A3835` charcoal · `#8C9A86` muted sage.
- Type: Cairo Variable (Arabic) + Inter Variable (Latin), self-hosted with Fontsource and loaded in the locale root layout.
