# BridgePass Company Criteria Dataset

## Purpose
This folder contains company-specific hiring criteria data for the BridgePass MVP.

BridgePass does not show the same developer profile to every company.
It extracts or models each company’s hiring criteria and helps the product show developer profiles through each employer’s lens.

## Files
- companyRubrics.json
- companySignals.json
- validationReports.json
- metadata.json

## How to Use
Frontend can load:

```ts
fetch('/data/company-criteria/companyRubrics.json')
```

and display company-specific rubrics.

## Why This Is Different
LinkedIn shows profiles.
Mynavi shows job postings.
Stack Overflow solves technical questions.
Generic AI agents give advice.
BridgePass provides company-specific hiring criteria and turns developer evidence into employer-relevant signals.

## Important Limitation
This dataset is for hackathon MVP demo use.
It is not a final hiring decision system.
AI or rule-based outputs should be reviewed by humans.
