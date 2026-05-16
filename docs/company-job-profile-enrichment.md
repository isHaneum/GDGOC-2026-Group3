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
- country
- salaryMin
- salaryMax
- salaryCurrency
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

## Salary Handling Rules

- If salary is not explicitly shown on an official role-specific page, leave `salaryMin` and `salaryMax` empty.
- Do not invent precise salary numbers from blog posts, social posts, or forum anecdotes.
- If only a broad compensation statement exists, keep salary blank and explain the gap in `notes`.

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