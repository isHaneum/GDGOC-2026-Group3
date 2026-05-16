# BridgePass Career Signal Engine

BridgePass is a Korea-Japan IT career platform prototype that helps Korean and Japanese developers understand cross-border hiring expectations, improve their profile, and prove their readiness to companies.

The app is fully configured for **English, Korean, and Japanese**:

- UI copy, navigation, buttons, field labels, empty states, and passport labels
- localized default candidate profile examples
- localized Bridge Labs recommendations
- localized fallback analysis and recruiter-lens rewrite when Gemini is not configured
- Gemini prompts that request the selected output language
- dynamic document language/title updates in the browser

This one-day hackathon MVP focuses on the **Career Signal Engine**:

1. Load small, manually written sample Japanese IT career/job records.
2. Extract structured hiring signals with Gemini or deterministic local fallback logic.
3. Build role-specific baselines from repeated signals.
4. Compare a developer profile against the selected role baseline.
5. Generate missing signals, recruiter-lens feedback, and Bridge Labs action plans.
6. Preview a company-facing Collaboration Passport.

The system provides guidance, not final hiring decisions.

## Tech Stack

- Frontend: React + Vite + TypeScript
- Styling: Tailwind CSS
- Backend: Node.js + Express
- AI: Gemini API structured JSON output
- Data: local JSON files
- Database/login: not required

## Setup

```bash
npm install
cp .env.example .env
```

Add a Gemini key to `.env`:

```bash
GEMINI_API_KEY=your_google_ai_studio_api_key
GEMINI_MODEL=gemini-2.5-flash
PORT=8787
```

Run the app:

```bash
npm run dev
```

Open:

- Web UI: `http://localhost:5173`
- API health: `http://localhost:8787/api/health`

The prototype still works without `GEMINI_API_KEY`; it uses local fallback extraction and analysis so the hackathon demo is reliable.

## Project Structure

```text
server/
  data/
    rawCareerSources.json
    extractedSignals.json
    roleBaselines.json
  services/
    analyzer.ts
    baselineBuilder.ts
    bridgeLabs.ts
    extractor.ts
    gemini.ts
    prompts.ts
    recruiterRefactorer.ts
    sampleData.ts
    schemas.ts
    storage.ts
src/
  api/client.ts
  App.tsx
  index.css
  main.tsx
shared/
  types.ts
```

## How Sample Data Is Processed

`server/data/rawCareerSources.json` contains 16 manually written sample summaries across:

- Junior Frontend Developer
- Backend Developer
- AI / Machine Learning Engineer
- Cyber Security
- General Japanese IT interview review
- Korean applicant concern about Japanese IT hiring

The samples are short summaries, not copied full articles. The MVP does not scrape private, login-protected, or prohibited websites and does not collect personal information.

## How Gemini Extracts Hiring Signals

`server/services/extractor.ts` sends each `RawCareerSource.summaryText` to Gemini through `server/services/gemini.ts`.

The prompt in `server/services/prompts.ts` asks Gemini to:

- extract only factual hiring signals from the text
- avoid hallucinating requirements
- return empty arrays or `"unknown"` when a field is not found
- evaluate work-readiness signals, not personality, nationality, or culture
- return JSON matching `ExtractedHiringSignal`

Gemini structured JSON output is configured with `responseMimeType: "application/json"` and a JSON schema.

## How The Baseline Is Built

`server/services/baselineBuilder.ts` groups extracted signals by role and country, then aggregates repeated terms using simple normalization and frequency counting.

The resulting `RoleBaseline` includes:

- technical baseline
- communication baseline
- soft skill baseline
- motivation baseline
- evidence baseline
- common risks
- recommended activities

This is intentionally lightweight for a 10-30 record MVP.

## How A Developer Profile Is Analyzed

`server/services/analyzer.ts` compares a `DeveloperProfile` against the selected `RoleBaseline`.

The scoring model is:

```text
overallFitScore =
15% technicalFitScore
+ 25% communicationFitScore
+ 20% motivationFitScore
+ 25% collaborationEvidenceScore
+ 15% evidenceConfidenceScore
```

The analysis focuses on:

- technical fit for the role
- Japanese workplace communication readiness
- motivation specificity
- teamwork and cross-border collaboration evidence
- concrete proof strength

The output is a `GapAnalysisResult` with matched signals, missing signals, risks, recruiter-lens feedback, recommended actions, recommended Bridge Labs, and a rewritten self-introduction.

## Recruiter Lens Refactorer

`server/services/recruiterRefactorer.ts` rewrites a general or Korean-style self-introduction for a Japanese IT recruiter.

The rewrite preserves facts, avoids exaggeration, and makes these points clearer:

- target role
- project contribution
- teamwork
- motivation
- evidence

## Bridge Labs Actions

`server/services/bridgeLabs.ts` maps missing signals and risks to activities:

- Japanese Bug Report Practice
- Korea-Japan Frontend Mini Project
- Japanese Technical Self-introduction Practice
- GitHub Collaboration Practice
- Japanese SaaS Company Research
- Portfolio Review with Japanese Developer

Each recommendation includes the reason, expected outcome, and proof created.

## Why BridgePass Is Different

LinkedIn shows profiles.

Mynavi shows job postings.

Stack Overflow solves technical questions.

Generic AI agents give advice.

**BridgePass extracts real hiring signals, compares them with developer profiles, and turns feedback into action plans and company-visible proof.**

## Useful Commands

```bash
npm run dev
npm run typecheck
npm run build
```

## Gemini References

- [Gemini API reference](https://ai.google.dev/api)
- [Gemini structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)

---

## 한국어 안내

BridgePass는 한국과 일본 개발자가 국경을 넘는 IT 채용 기대치를 이해하고, 프로필을 개선하며, 기업이 확인할 수 있는 준비도 증빙을 만들도록 돕는 커리어 플랫폼 MVP입니다.

이 프로젝트의 핵심 기능은 **Career Signal Engine**입니다.

1. 일본 IT 채용/커리어 샘플 데이터를 로컬 JSON으로 불러옵니다.
2. Gemini 또는 로컬 fallback 로직으로 채용 시그널을 구조화합니다.
3. 직무별 기준선을 만듭니다.
4. 개발자 프로필을 기준선과 비교합니다.
5. 부족한 시그널, 리크루터 렌즈 피드백, Bridge Labs 추천 액션을 생성합니다.
6. 기업이 볼 수 있는 Collaboration Passport를 미리 보여줍니다.

다국어 구성:

- 영어, 한국어, 일본어 UI 제공
- 언어 선택 시 기본 후보자 예시도 해당 언어로 전환
- 추천 활동과 fallback 분석 결과도 선택 언어로 제공
- Gemini 사용 시 선택 언어로 JSON 응답을 생성하도록 프롬프트 설계

차별점:

LinkedIn은 프로필을 보여줍니다.

Mynavi는 채용 공고를 보여줍니다.

Stack Overflow는 기술 질문을 해결합니다.

일반 AI 에이전트는 조언을 제공합니다.

**BridgePass는 실제 채용 시그널을 추출하고, 개발자 프로필과 비교한 뒤, 피드백을 실행 가능한 액션 플랜과 기업이 볼 수 있는 증빙으로 바꿉니다.**

---

## 日本語案内

BridgePassは、韓国と日本の開発者が国境を越えたIT採用期待を理解し、プロフィールを改善し、企業に見せられる準備度の証拠を作るためのキャリアプラットフォームMVPです。

このプロジェクトの中心機能は **Career Signal Engine** です。

1. 日本IT採用/キャリアのサンプルデータをローカルJSONから読み込みます。
2. Geminiまたはローカルfallbackロジックで採用シグナルを構造化します。
3. 職種別の基準を作成します。
4. 開発者プロフィールを基準と比較します。
5. 不足シグナル、リクルーターレンズフィードバック、Bridge Labs推奨アクションを生成します。
6. 企業に見せられるCollaboration Passportをプレビューします。

多言語構成:

- 英語、韓国語、日本語UIを提供
- 言語選択時にデフォルト候補者例も該当言語へ切り替え
- 推奨活動とfallback分析結果も選択言語で提供
- Gemini使用時は選択言語でJSON応答を生成するようにプロンプトを設計

差別化:

LinkedInはプロフィールを見せます。

Mynaviは求人情報を見せます。

Stack Overflowは技術質問を解決します。

一般的なAIエージェントは助言をします。

**BridgePassは実際の採用シグナルを抽出し、開発者プロフィールと比較し、フィードバックを実行可能なアクションプランと企業に見せられる証拠へ変換します。**
