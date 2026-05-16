# Company Salary Research Plan

This project must not invent exact salary, starting salary, location, language, or role requirement data. Store only structured facts that can be traced to a source, and mark uncertain data as confirmation needed.

## Source Priority

1. Official role-specific career page
2. Official engineering recruitment page
3. Official new graduate recruitment page
4. Official salary or benefits page
5. Public job boards with salary shown
6. Salary review sites only as secondary reference

## Recommended Source Types

- Official careers pages
- Official new graduate pages
- JapanDev job listings
- TokyoDev job listings
- OpenWork salary pages
- 転職会議 salary or review pages
- JobDraft salary pages
- LAPRAS jobs if public
- Green job listings if public
- Wantedly job pages if public

## Data Rules

- Official sources override every secondary source.
- Salary review sites are not official; set source confidence to low or secondary.
- If salary differs by role, grade, or experience, store a salary note instead of pretending one number applies.
- If salary is unknown, use null for numeric salary fields and add a confirmation-needed note.
- Do not access login-protected pages.
- Do not scrape aggressively.
- Do not copy full job descriptions.
- Store structured facts only: numbers, currency, location, work style, language level, requirement summary, and source URL.

## Field Guidance

For new graduate or starting salary:

- startingSalaryMin
- startingSalaryMax
- startingSalaryCurrency
- startingSalaryNote

For mid-career or role-specific salary:

- salaryMin
- salaryMax
- salaryCurrency
- salaryNote

If a salary source cannot be verified, keep the numeric values null and add `salary` to `missingFields`.