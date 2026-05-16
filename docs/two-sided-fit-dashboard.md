# Two-sided Fit Dashboard

## Purpose

`TwoSidedFitDashboard` is an isolated debug/demo surface for the BridgePass Two-sided Fit Engine. It shows why BridgePass is not a normal job board: developers can see company and role fit, while companies can review candidate fit with gaps, risks, and evidence missions.

The dashboard is production-styled but intentionally isolated so it can be imported into the real website later without changing existing backend behavior.

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

- The language switcher is visual only and does not perform full i18n yet.
- Developer profile fields are read-only for now.
- Salary, language, location, and experience gaps remain visible when source data is unknown.
- The dashboard depends on the existing public JSON files being present.

## Safety Note

This dashboard is not an automated hiring decision system. Scores are guidance signals for discovery, preparation, recruiter review, and human decision-making.

## API Key And Gemini Behavior

No API keys are required. Gemini is not called from this page. The dashboard does not add `.env`, `gemini.key`, Stitch MCP config, or browser-side secret usage.
