# Two-sided Fit Dashboard

## Purpose

`TwoSidedFitDashboard` is an isolated debug/demo surface for the BridgePass Two-sided Fit Engine. It shows why BridgePass is not a normal job board: developers can see company and role fit, while companies can review candidate fit with gaps, risks, and evidence missions.

The dashboard is production-styled but intentionally isolated so it can be imported into the real website later without changing existing backend behavior.

## UX Flow

The dashboard now uses a guided ranking flow instead of dense stacked result cards.

### Developer To Company

The developer side computes the top 10 company matches with `rankCompaniesForDeveloper(...)`.

- A horizontal rank navigator shows `#1` through `#10`.
- Previous and next buttons step through companies one at a time.
- Only the selected company detail is expanded.
- The default view emphasizes overall fit, recommended next step, matched reasons, missing signals, and evidence missions.
- Detailed score bars are hidden inside a collapsed "Detailed score breakdown" accordion.

### Company To Developer

The company side computes the top 10 candidate matches with `rankDevelopersForCompany(...)`.

- Recruiters first see a compact top-10 candidate ranking list.
- Each candidate summary shows rank, name, nationality, top 3 key signals, fit score, and recommended recruiter action.
- Clicking a candidate opens a detailed candidate panel below the list.
- Candidate details include resume summary, motivation, languages, tech stacks, match signals, gaps, risks, recruiter action, and a collapsed score breakdown.

## Key Signal Display

Candidate summary cards derive three display signals from:

- developer tech stacks
- language certifications
- target roles
- engine `topMatchSignals`

The helper prefers strong tech stack matches first, then language certification, then role/domain signals. These are display-only summaries and do not change scoring.

## I18n

The dashboard includes a small dictionary-based i18n layer inside `TwoSidedFitDashboard.tsx`.

Supported UI locales:

- Korean (`ko`)
- Japanese (`ja`)
- English (`en`)

The language switcher updates practical UI labels such as headers, tabs, section titles, validation labels, safety copy, candidate list labels, and score breakdown labels.

Data values from JSON are not fully translated. Company names, candidate names, role titles, generated explanations, signals, and missions remain in their source language unless the dataset already provides translated values.

## Data Files Used

The component loads local JSON through `src/lib/companyCriteria.ts`:

- `public/data/company-criteria/companyJobProfiles.json`
- `public/data/company-criteria/companyRubrics.json`
- `public/data/company-criteria/companySignals.json`
- `public/data/company-criteria/sampleDeveloperProfiles.json`
- `public/data/company-criteria/fitEngineMetadata.json`

## Engine Functions Called

The component calls the existing rule-based fit engine functions from `src/lib/twoSidedFitEngine.ts`:

- `rankCompaniesForDeveloper(...)`
- `rankDevelopersForCompany(...)`
- `validateCompanyJobProfiles(...)`

These functions run in the browser against local JSON data only.

## Import

```tsx
import { TwoSidedFitDashboard } from "../components/TwoSidedFitDashboard";
```

For the current Next App Router debug route, the import is:

```tsx
import { TwoSidedFitDashboard } from "../../../src/components/TwoSidedFitDashboard";
```

## Demo Route

An isolated demo page is available at:

```txt
/debug/two-sided-fit
```

The route only renders the dashboard component. It does not modify the existing homepage or existing debug pages.

## Adding It To A Real Route Later

Create a new page and render the component:

```tsx
import { TwoSidedFitDashboard } from "../../src/components/TwoSidedFitDashboard";

export default function Page() {
  return <TwoSidedFitDashboard />;
}
```

Adjust the relative import path based on the final route location.

## Known Limitations

- Developer profile fields are read-only for now.
- Salary, language, location, and experience gaps remain visible when source data is unknown.
- The dashboard depends on the existing public JSON files being present.
- The i18n layer is intentionally local and lightweight, not a full app-wide translation framework.

## Safety Note

This dashboard is not an automated hiring decision system. Scores are guidance signals for discovery, preparation, recruiter review, and human decision-making.

## API Key And Gemini Behavior

No API keys are required. Gemini is not called from this page. The dashboard does not add `.env`, `gemini.key`, Stitch MCP config, or browser-side secret usage.
