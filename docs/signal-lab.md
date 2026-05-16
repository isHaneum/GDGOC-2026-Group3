# Signal Lab

Signal Lab compares sample developer profiles with company job profiles and company-specific rubrics. The page is a validation surface for the recommendation engine, not a hiring decision screen.

## Data Sources

- Company job profiles load from `public/data/company-criteria/companyJobProfiles.json`.
- Rubrics and signals load through the same-origin Next API routes under `/api/company-criteria/*`.
- If `BRIDGEPASS_ENGINE_API_BASE_URL` is configured, those Next routes proxy to the external Express criteria engine.
- If the external server URL is missing, the page falls back to static JSON in `public/data/company-criteria/`.

## Server Integration

For local development, set this non-secret value in `.env.local`:

```env
BRIDGEPASS_ENGINE_API_BASE_URL=http://localhost:3000
```

Do not copy Supabase service role keys, Gemini keys, `server.env`, or `gemini.key` into the frontend repo.

## Display Rules

- Developer mode uses `/signal-lab?role=developer` and shows only developer-to-company recommendations.
- Employer mode uses `/signal-lab?role=employer` and shows only company-to-candidate recommendations.
- `/signal-lab` without a role shows two role cards instead of mixing both workflows.
- Recommendation lists use a bounded panel with `max-height` and internal `overflow-y-auto` scrolling, so Top 10 results do not make the whole page excessively long.
- Default cards stay compact. Detailed score bars and longer information are available only in the selected detail panel or debug mode.
- `logoUrl` is optional. If no safe local asset exists, Signal Lab shows initials instead of hotlinking or downloading official logos.
- `salaryMin` and `salaryMax` may be `null`; Signal Lab displays the salary note instead of inventing a range.
- `hiringPeriod.startDate`, `hiringPeriod.endDate`, and `applicationDeadline` may be `null`; Signal Lab displays confirmation-needed copy.
- `qualificationSummary` and `jobDescriptionSummary` should be shown only when backed by existing source data. Otherwise show confirmation-needed copy.
- `locations` can remain broad when exact city or office policy is not verified.
- `requiredLanguages` should stay empty unless an official role-specific page states a hard requirement.
- `missingFields`, `sourceConfidence`, `jobPostingUrl`, validation summary, and raw JSON are hidden by default.
- Debug mode shows `missingFields`, `sourceConfidence`, `jobPostingUrl`, validation summary, metadata, and raw selected profile/result JSON.

## Safety Notes

Signal Lab rankings are deterministic recommendations for exploration and preparation. They should not be used as automated hiring decisions, compensation decisions, or eligibility screening.