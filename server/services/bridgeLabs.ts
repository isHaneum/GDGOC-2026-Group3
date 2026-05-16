import type { BridgeLabRecommendation, Locale } from "../../shared/types";

const bridgeLabCatalog: Record<Locale, BridgeLabRecommendation[]> = {
  en: [
    {
      activity: "Japanese Bug Report Practice",
      reason: "Builds evidence that the candidate can explain issues, reproduction steps, impact, and expected behavior in Japanese.",
      expectedOutcome: "Clearer workplace reporting and lower communication risk for Japanese engineering teams.",
      proofCreated: "A Japanese bug report with screenshots, reproduction steps, severity, and proposed next action."
    },
    {
      activity: "Korea-Japan Frontend Mini Project",
      reason: "Creates role-specific proof of technical execution and cross-border collaboration habits.",
      expectedOutcome: "A small working product with visible ownership, pull requests, and review history.",
      proofCreated: "A deployed mini project, bilingual README, issues, and merged pull requests."
    },
    {
      activity: "Japanese Technical Self-introduction Practice",
      reason: "Improves the candidate's ability to connect role, project contribution, teamwork, and motivation in recruiter language.",
      expectedOutcome: "A concrete, respectful self-introduction that reduces interview uncertainty.",
      proofCreated: "A one-minute Japanese self-introduction script and reviewed revision notes."
    },
    {
      activity: "GitHub Collaboration Practice",
      reason: "Shows teamwork evidence beyond self-reported claims.",
      expectedOutcome: "Better proof of review behavior, issue discussion, and implementation ownership.",
      proofCreated: "Issues, pull requests, review comments, and a short collaboration retrospective."
    },
    {
      activity: "Japanese SaaS Company Research",
      reason: "Makes motivation more specific to product, market, and company context.",
      expectedOutcome: "A stronger reason for Japan and target companies than general interest.",
      proofCreated: "A one-page company research memo with product, users, role fit, and questions."
    },
    {
      activity: "Portfolio Review with Japanese Developer",
      reason: "Turns portfolio claims into clearer evidence for Japanese hiring expectations.",
      expectedOutcome: "More credible README, project explanation, and skill-to-role alignment.",
      proofCreated: "A portfolio checklist, reviewer notes, and prioritized improvement plan."
    }
  ],
  ko: [
    {
      activity: "일본어 버그 리포트 연습",
      reason: "문제 상황, 재현 절차, 영향도, 기대 동작을 일본어로 설명할 수 있다는 증거를 만듭니다.",
      expectedOutcome: "일본 개발팀이 우려하는 업무 보고 리스크를 낮추고 커뮤니케이션 신뢰도를 높입니다.",
      proofCreated: "스크린샷, 재현 절차, 심각도, 다음 조치가 포함된 일본어 버그 리포트."
    },
    {
      activity: "한일 프론트엔드 미니 프로젝트",
      reason: "직무 관련 기술 실행력과 국경 간 협업 습관을 함께 증명합니다.",
      expectedOutcome: "개인 기여, pull request, 리뷰 이력이 보이는 작은 동작 제품을 만듭니다.",
      proofCreated: "배포된 미니 프로젝트, 이중 언어 README, 이슈, 병합된 pull request."
    },
    {
      activity: "일본어 기술 자기소개 연습",
      reason: "직무, 프로젝트 기여, 팀워크, 지원 동기를 리크루터가 이해하기 쉬운 언어로 연결합니다.",
      expectedOutcome: "면접 불확실성을 줄이는 구체적이고 정중한 자기소개를 완성합니다.",
      proofCreated: "1분 일본어 기술 자기소개 스크립트와 리뷰 반영 기록."
    },
    {
      activity: "GitHub 협업 연습",
      reason: "자기 보고를 넘어 실제 협업 행동의 증거를 만듭니다.",
      expectedOutcome: "리뷰 태도, 이슈 논의, 구현 책임 범위가 더 명확해집니다.",
      proofCreated: "이슈, pull request, 리뷰 코멘트, 짧은 협업 회고."
    },
    {
      activity: "일본 SaaS 기업 리서치",
      reason: "지원 동기를 제품, 시장, 회사 맥락에 더 구체적으로 연결합니다.",
      expectedOutcome: "단순한 일본 관심이 아니라 목표 회사와 직무에 맞춘 동기를 만듭니다.",
      proofCreated: "제품, 사용자, 직무 적합성, 질문이 포함된 1페이지 기업 리서치 메모."
    },
    {
      activity: "일본 개발자와 포트폴리오 리뷰",
      reason: "포트폴리오의 주장들을 일본 채용 기대치에 맞는 증거로 정리합니다.",
      expectedOutcome: "README, 프로젝트 설명, 직무 적합성이 더 신뢰도 있게 보입니다.",
      proofCreated: "포트폴리오 체크리스트, 리뷰어 메모, 우선순위 개선 계획."
    }
  ],
  ja: [
    {
      activity: "日本語バグレポート練習",
      reason: "問題、再現手順、影響、期待動作を日本語で説明できる証拠を作ります。",
      expectedOutcome: "日本の開発チームが気にする報告リスクを下げ、職場コミュニケーションの信頼度を高めます。",
      proofCreated: "スクリーンショット、再現手順、重要度、次の対応を含む日本語バグレポート。"
    },
    {
      activity: "韓日フロントエンドミニプロジェクト",
      reason: "職種に直結する技術実行力と国境を越えた協業習慣を証明します。",
      expectedOutcome: "担当範囲、pull request、レビュー履歴が見える小さな動作プロダクトを作ります。",
      proofCreated: "デプロイ済みミニプロジェクト、二言語README、issue、マージ済みpull request。"
    },
    {
      activity: "日本語技術自己紹介練習",
      reason: "職種、プロジェクト貢献、チームワーク、志望動機をリクルーターに伝わる形で整理します。",
      expectedOutcome: "面接時の不確実性を下げる具体的で丁寧な自己紹介を作ります。",
      proofCreated: "1分の日本語技術自己紹介スクリプトとレビュー反映メモ。"
    },
    {
      activity: "GitHub協業練習",
      reason: "自己申告だけでなく、実際の協業行動を示す証拠を作ります。",
      expectedOutcome: "レビュー姿勢、issueでの議論、実装担当範囲が明確になります。",
      proofCreated: "issue、pull request、レビューコメント、短い協業ふりかえり。"
    },
    {
      activity: "日本SaaS企業リサーチ",
      reason: "志望動機をプロダクト、市場、会社文脈により具体的につなげます。",
      expectedOutcome: "日本への一般的な興味ではなく、対象企業と職種に合った動機を作ります。",
      proofCreated: "プロダクト、ユーザー、職種適合性、質問を含む1ページ企業リサーチメモ。"
    },
    {
      activity: "日本人開発者とのポートフォリオレビュー",
      reason: "ポートフォリオ上の主張を日本の採用期待に合う証拠として整理します。",
      expectedOutcome: "README、プロジェクト説明、職種との関連性がより信頼できる形になります。",
      proofCreated: "ポートフォリオチェックリスト、レビューメモ、優先改善計画。"
    }
  ]
};

export const bridgeLabs = bridgeLabCatalog.en;

function resolveLocale(locale?: Locale): Locale {
  return locale === "ko" || locale === "ja" ? locale : "en";
}

export function getBridgeLabs(locale?: Locale): BridgeLabRecommendation[] {
  return bridgeLabCatalog[resolveLocale(locale)];
}

export function recommendBridgeLabs(
  missingSignals: string[],
  risks: string[],
  role?: string,
  locale?: Locale
): BridgeLabRecommendation[] {
  const text = `${missingSignals.join(" ")} ${risks.join(" ")} ${role ?? ""}`.toLowerCase();
  const selected = new Set<string>();

  const add = (activity: string) => selected.add(activity);

  if (/(bug|report|incident|communication|japanese|delay|issue|보고|리포트|일본어|지연|이슈|報告|日本語|遅延|課題)/.test(text)) {
    add("Japanese Bug Report Practice");
  }
  if (/(frontend|react|ui|portfolio|technical|project|deployed|프론트엔드|포트폴리오|프로젝트|배포|フロントエンド|ポートフォリオ|プロジェクト|デプロイ)/.test(text)) {
    add("Korea-Japan Frontend Mini Project");
  }
  if (/(self-introduction|introduction|motivation|recruiter|interview|자기소개|지원 동기|리크루터|면접|自己紹介|志望動機|リクルーター|面接)/.test(text)) {
    add("Japanese Technical Self-introduction Practice");
  }
  if (/(team|collaboration|pull request|github|review|cross-border|팀|협업|리뷰|한일|チーム|協業|レビュー|韓日)/.test(text)) {
    add("GitHub Collaboration Practice");
  }
  if (/(company|product|market|motivation|japan|domain|saas|회사|제품|시장|일본|기업|プロダクト|市場|日本|企業)/.test(text)) {
    add("Japanese SaaS Company Research");
  }
  if (/(evidence|readme|portfolio|proof|weak|vague|증빙|포트폴리오|근거|모호|エビデンス|証拠|ポートフォリオ|曖昧)/.test(text)) {
    add("Portfolio Review with Japanese Developer");
  }

  const localizedLabs = getBridgeLabs(locale);
  const englishLabs = bridgeLabCatalog.en;
  const prioritized = englishLabs
    .map((lab, index) => ({ activity: lab.activity, localized: localizedLabs[index] }))
    .filter((entry) => selected.has(entry.activity))
    .map((entry) => entry.localized);

  return (prioritized.length ? prioritized : localizedLabs.slice(0, 3)).slice(0, 4);
}
