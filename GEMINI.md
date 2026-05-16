# The Bridge - Project Architecture & Conventions

## Core Concept
"The Bridge" is a culture-first job platform for junior developers moving between Korea and Japan.

## Technical Stack
- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (with custom color scheme: `#adebad` primary, `#ffffff` white)
- **AI:** Gemini API via Node.js fetch (Server-side)
- **Architecture:** Market-Tenant Model

## Directory Structure
- `app/`: Next.js App Router routes.
  - `developer/`: Developer-facing dashboard and features.
  - `employer/`: Employer-facing dashboard and recruitment tools.
  - `api/`: Backend API routes handling AI analysis and data.
- `src/`: Shared frontend components and logic.
- `server/`: Backend services, AI logic, and data processing.
- `shared/`: Shared TypeScript types and configurations (e.g., `MarketConfig`).

## Market-Tenant Model
The application dynamically adapts based on the `MarketConfig` defined in `shared/market.ts`. Always use `getCurrentMarket()` to retrieve regional configurations like source/target countries and branding.

## Styling Conventions
- Use Tailwind utility classes.
- Use the custom `bridge` color palette:
  - `bridge-primary`: `#adebad`
  - `bridge-white`: `#ffffff`
  - `bridge-teal`, `bridge-blue`, `bridge-coral`, `bridge-amber`, `bridge-paper`
- Prefer `shadow-panel` for card components.

## AI Integration
- Gemini API is used for profile analysis, cultural gap assessment, and "Invisible Activity" scoring.
- All AI logic should reside in `server/services` and be exposed via Next.js API routes.
- Use `generateGeminiJson` for structured AI responses.

## Development Workflow
- Run `npm run dev` for local development.
- Run `npm run build` to verify production readiness.
- Run `npm run typecheck` to ensure type safety.
