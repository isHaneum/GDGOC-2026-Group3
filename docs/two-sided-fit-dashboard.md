# Two-sided Fit Dashboard

## Purpose

`TwoSidedFitDashboard` is still isolated from the main product flow, but the UX now behaves more like a product search result page than an internal debug report.

The dashboard explains fit in both directions without exposing API keys, without changing unrelated pages, and without turning the output into an automated hiring decision.

## UX Changes

### Developer To Company

The developer side now starts with a vertical Top 10 company ranking list.

- Each row shows company identity first, not just rank.
- Company name, role title, fit label, location fit, salary fit, language fit, key reason, missing item, and next step are visible in the list.
- Clicking a row opens one selected company detail panel.
- The selected detail emphasizes `What matches`, `What you still need`, and `Recommended evidence missions`.
- Detailed score breakdowns remain available, but they are collapsed by default.

### Company To Developer

The recruiter side now starts with a Top 10 candidate summary list instead of opening every candidate in full detail.

- Each row shows rank, name, nationality, top 3 key signals, fit label, and recommended recruiter action.
- Detailed resume and evaluation content opens only after a recruiter clicks a candidate.
- Candidate detail groups strengths by qualifications, tech stack, language ability, experience, and evidence.
- Missing evidence and risks are visible without over-emphasizing raw scores.

## Translation And Labels

The dashboard includes a local dictionary-based UI layer for:

- Korean (`ko`)
- Japanese (`ja`)
- English (`en`)

All static UI labels switch with the selected locale.

Generated explanations, company names, candidate names, role titles, and dataset values may still remain in their original language until a translation provider is connected.

## Translation Service Abstraction

`src/lib/translationService.ts` provides a safe abstraction for future Korean, Japanese, and English translation.

- The browser does not contain API keys.
- No translation API is called directly from client-side business logic.
- The current implementation safely falls back to a mock provider and returns original text when no server route is available.
- The UI can translate developer profile text to the selected language and clearly notes when the provider is only a mock fallback.

## Data Notes

The dashboard uses local data from:

- `public/data/company-criteria/companyJobProfiles.json`
- `public/data/company-criteria/companyRubrics.json`
- `public/data/company-criteria/companySignals.json`
- `public/data/company-criteria/sampleDeveloperProfiles.json`
- `public/data/company-criteria/fitEngineMetadata.json`

The company job profile dataset has been expanded with additional role-specific profiles.

Unknown salary, language, and location details are intentional. BridgePass now prefers explicit gaps over hallucinated precision.

The next role-specific verification work is tracked in `public/data/company-criteria/companyDataEnrichmentPlan.json`.

## Validation

`validateCompanyJobProfiles(...)` now reports:

- total profile count
- valid, warning, and invalid profile counts
- common warning summaries
- per-company warning detail

Warnings remain visible in the UI as review prompts, not as fatal product errors.

## Safety Note

This dashboard is not an automated hiring decision system. Scores are guidance signals for discovery, preparation, and human review.

## API Key And Secret Handling

- No API key was added to the browser.
- No `.env` secrets were committed.
- No Stitch MCP config was added.
- No Gemini or paid translation API is called directly from the client.
