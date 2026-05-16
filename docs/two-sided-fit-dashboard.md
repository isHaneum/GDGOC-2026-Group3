# Two-sided Fit Dashboard

## Purpose

`TwoSidedFitDashboard` is a product-ready BridgePass Career Fit page for two core flows:

- Developers find companies and roles that fit them.
- Companies find candidates that fit a selected role.

The page stays isolated from the rest of the app, uses local JSON data, and does not modify backend scoring logic.

## Simplified Product Flow

The default view removes internal report-style sections. Users see only the information needed to compare fit:

- what matches
- what is missing
- next step
- compact details after selection

The default view hides raw JSON, validation details, source confidence, rubric IDs, long notes, and internal metadata.

## Developer View

The developer view shows:

- compact profile summary
- vertical Top 10 company list with company names and roles
- fit label plus small score
- location, salary, and language confirmation status
- what matches
- what needs work
- next step

The full profile is available in a collapsed profile details section. Selecting a company opens the focused company detail panel.

## Company View

The company view shows:

- compact selected role summary
- vertical Top 10 candidate list
- candidate name, nationality, top 3 key signals, fit label, and recruiter action
- candidate detail only after selection

Candidate detail groups strong points by qualifications, tech stack, language, experience, and evidence.

## Score Display

Detailed score bars are not shown by default. They remain available inside a collapsed "Detailed score breakdown" accordion in selected company and candidate detail panels.

Candidate cards emphasize fit labels instead of large numeric scores:

- Very strong
- Strong
- Potential
- Needs preparation
- Low fit

## Debug Mode

Debug mode defaults to `false`.

When debug mode is off, the dashboard hides:

- raw JSON
- validation details
- source confidence
- rubric ID
- long internal notes
- metadata-style counts

When debug mode is on, the dashboard shows validation status, common warnings, selected input/output JSON, and internal role fields. Unknown fields are intentionally left blank instead of invented.

## Multilingual Support

The component uses a local dictionary for static UI labels:

- Korean (`ko`)
- Japanese (`ja`)
- English (`en`)

Company names, candidate names, role names, generated fit text, and dataset values are not translated. Translation provider details are not shown in the default product UI.

## Data Files Used

The component loads local JSON through `src/lib/companyCriteria.ts`:

- `public/data/company-criteria/companyJobProfiles.json`
- `public/data/company-criteria/companyRubrics.json`
- `public/data/company-criteria/companySignals.json`
- `public/data/company-criteria/sampleDeveloperProfiles.json`
- `public/data/company-criteria/fitEngineMetadata.json`

## Engine Functions Called

The dashboard calls existing rule-based fit engine functions:

- `rankCompaniesForDeveloper(...)`
- `rankDevelopersForCompany(...)`
- `validateCompanyJobProfiles(...)`

No scoring engine changes are required for the product UI.

## Import

```tsx
import { TwoSidedFitDashboard } from "../components/TwoSidedFitDashboard";
```

For the current debug route:

```tsx
import { TwoSidedFitDashboard } from "../../../src/components/TwoSidedFitDashboard";
```

## Demo Route

```txt
/debug/two-sided-fit
```

## Safety Note

This dashboard is not an automated hiring decision system. Scores are used for discovery, preparation, and human review.

## API Key And Secret Handling

- No API key is required.
- No `.env` secret is added.
- No Stitch MCP config is added.
- Gemini is not called from this page.
