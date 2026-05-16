# Company Job Profile Enrichment

## Goal

Collect role-specific company hiring data for BridgePass without inventing unknown values.

One company should not be modeled as one generic job profile. Each role should be stored separately when the public hiring surface supports it.

Examples:

- Mercari: Frontend Engineer, Backend Engineer, Mobile Engineer, SRE / DevOps Engineer
- PayPay: Backend Engineer, Mobile Engineer, SRE / DevOps Engineer
- SmartHR: Frontend Engineer, Backend Engineer, Product Engineer

## Required Fields

Each job profile should try to capture the following:

- companyId
- companyName
- roleId
- roleTitle
- logoUrl
- logoAlt
- country
- headquarters
- salaryMin
- salaryMax
- salaryCurrency
- salaryNote
- jobPostingUrl
- jobPostingStatus
- hiringPeriod
- applicationDeadline
- employmentType
- qualificationSummary
- jobDescriptionSummary
- benefitsSummary
- selectionProcess
- locations
- requiredTechStacks
- preferredTechStacks
- requiredLanguages
- preferredLanguages
- experienceRange
- workStyle
- companyType
- roleCategory
- rubricId
- sourceConfidence
- sourceUrls
- isNewGradFriendly
- isJuniorFriendly
- lastVerifiedAt
- missingFields
- notes

## Good URL Patterns

- /careers/engineer
- /recruit/engineer
- /jobs/frontend-engineer
- /jobs/software-engineer
- /engineering/recruit
- /newgrad/engineer
- /mid-career/engineer

## Bad URL Patterns

- /company
- /about
- generic /careers with no role detail
- generic /recruit with only branding copy

## Source Confidence Rules

- `high`: official role-specific page includes role title and enough fields to fill location, tech, or language requirements.
- `medium`: official engineering hiring page narrows to a role family but some fields still need follow-up.
- `low`: company-level engineering page implies the role but does not provide enough role-specific detail.
- `fallback`: data is derived from rubric, hiring signal, or role-family inference and must be re-verified.

If a field is inferred from existing rubrics, signals, or role-family data instead of an official role-specific posting, keep `sourceConfidence` as `low` or `fallback`.

## Job Posting Field Rules

- `jobPostingUrl` should be an official role-specific job page when available. Leave it as an empty string when only generic company pages are known.
- `jobPostingStatus` must be `unknown` unless the source clearly states that the posting is open or closed.
- `hiringPeriod.startDate` and `hiringPeriod.endDate` must stay `null` unless an official source states dates.
- `hiringPeriod.note` should be `Confirmation needed` when dates are unknown.
- `applicationDeadline` must stay `null` unless a deadline is explicitly shown.
- `employmentType` should be one of `full-time`, `internship`, `contract`, `new-grad`, or `unknown`.
- `qualificationSummary` should summarize only stated or existing structured requirements. Do not turn brand copy into requirements.
- `jobDescriptionSummary` should stay empty unless there is a source-backed role summary.
- `benefitsSummary` and `selectionProcess` should stay empty unless the source explicitly provides those details.

## Salary Handling Rules

- If salary is not explicitly shown on an official role-specific page, set `salaryMin` and `salaryMax` to `null`.
- Use the local market currency only when the country is clear, for example `JPY` for Japan roles. Currency is not a salary estimate.
- Add `salaryNote` and include `salary` in `missingFields` whenever exact compensation is not verified.
- Do not invent precise salary numbers from blog posts, social posts, or forum anecdotes.
- If only a broad compensation statement exists, keep salary blank and explain the gap in `notes`.

## Logo Rules

- Store local placeholder SVGs under `public/company-logos/` unless an official asset license and usage path are confirmed.
- Placeholder SVGs must be simple marks, not copied official logos.
- Set `logoUrl` and `logoAlt` so Signal Lab can show a stable visual anchor.

## Missing Data Rules

- Use `missingFields` to distinguish intentionally unknown values from accidental omissions.
- Valid values include `salary`, `location`, `languageRequirement`, `experienceRange`, `requiredTechStacks`, `preferredTechStacks`, `workStyle`, and `roleSpecificSource`.
- Job posting gaps can additionally use `officialJobPostingUrl`, `hiringPeriod`, `applicationDeadline`, `qualificationSummary`, and `jobDescriptionSummary`.
- `sourceUrls` should point to official company, engineering, or role pages used as source anchors.
- `sourceConfidence` should stay `low` or `fallback` when the source is not role-specific, even if it is official.

## Language Requirement Rules

- Only store a language requirement when the public source clearly states it.
- Distinguish `requiredLanguages` from `preferredLanguages`.
- Do not convert a global team description into a hard language requirement.
- If multilingual collaboration is implied but not formalized, keep the requirement blank and mention it in `notes`.

## Validation Checklist

- Confirm the role title is role-specific, not just "Software Engineer" unless that is the actual posting title.
- Confirm `rubricId` maps to an existing company rubric.
- Confirm `locations` are based on the posting, not assumption.
- Confirm `requiredTechStacks` and `preferredTechStacks` are backed by the source.
- Confirm `sourceConfidence` reflects the real source quality.
- Keep unknown fields intentionally blank instead of filling them with guesses.
- Record the next verification action in `companyDataEnrichmentPlan.json` when the role is still incomplete.
- Confirm no secrets, API keys, Stitch config, or local `.env` values are committed with data updates.