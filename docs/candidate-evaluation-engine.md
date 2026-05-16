# Candidate Evaluation Engine

## Purpose
This module evaluates a candidate profile against a company-specific rubric.

## Input
- companyId
- candidate resume/profile
- optional portfolio and motivation text

## Output
- overall fit score
- criterion-level scores
- strengths
- gaps
- risks
- recommended actions
- suggested next step

## Important limitation
This system does not make hiring decisions.
It only provides guidance signals and should be reviewed by humans.

## Relationship to Company Criteria Dataset
companyRubrics.json provides the employer-specific evaluation criteria.
Candidate Evaluation Engine uses those criteria to evaluate candidate evidence.

## Implementation shape
This implementation is isolated from the main UI.

- Static dataset: `public/data/company-criteria/*`
- Frontend-safe loaders: `src/lib/companyCriteria.ts`, `src/lib/candidateEvaluation.ts`
- Backend service: `server/services/candidateEvaluator.ts`
- API route: `POST /api/candidate-evaluation/evaluate`
- Status route: `GET /api/candidate-evaluation/status`
- Manual debug page: `/debug/candidate-evaluation`

## Local Gemini key setup
Use one of the following:

1. Set `GEMINI_API_KEY` in `.env.local`
2. Or place a local `gemini.key` file in the repo root

Both are gitignored and never sent to the browser.

## Verification flow
1. Start the app.

```bash
npm run dev
```

2. Check that the dataset is reachable.

```bash
curl http://localhost:5173/data/company-criteria/metadata.json
```

3. Check Gemini status and company list.

```bash
curl http://localhost:5173/api/candidate-evaluation/status
```

4. Open the manual debug page.

```text
http://localhost:5173/debug/candidate-evaluation
```

5. Evaluate a sample candidate by API.

```bash
curl -X POST http://localhost:5173/api/candidate-evaluation/evaluate \
  -H 'Content-Type: application/json' \
  -d '{
    "companyId": "mercari",
    "candidate": {
      "candidateName": "Demo Candidate",
      "targetRole": "Frontend / Mobile Developer",
      "resumeText": "I built mobile and web projects using SwiftUI, React, Firebase, and API integration. I have experience creating user flows, implementing authentication, and improving UI based on feedback.",
      "portfolioText": "Built a medication habit tracking app and a Korea-Japan developer collaboration prototype.",
      "languageSkills": ["Korean native", "Japanese intermediate", "English intermediate"],
      "projectExperience": "Several team projects and personal product prototypes. Limited verified Japan-Korea collaboration experience.",
      "selfIntroduction": "I want to work with Japanese IT companies because I am interested in Korea-Japan product collaboration.",
      "motivation": "I want to contribute to products that connect Korean and Japanese users through mobile and frontend development."
    }
  }'
```

6. Confirm the response contains:
- `overallFitScore`
- `criterionScores`
- `strengths`
- `gaps`
- `recommendedNextStep`
- `safetyNote`
- `evaluationMode`
- `debug.geminiUsed`
- `debug.fallbackReason`

## Gemini behavior
If Gemini is configured on the server, the route tries structured recruiter-guidance evaluation first.
If Gemini is unavailable, unsupported, or quota-limited, the system falls back to deterministic local scoring.

## Safety
- No API key is exposed to the browser.
- Candidate data is not sent to Gemini from the browser.
- The result is a recruiter guidance signal, not a final hiring decision.