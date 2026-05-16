import type {
  BridgeLabRecommendation,
  DeveloperProfile,
  GapAnalysisResult,
  Locale,
  RoleBaseline
} from "../../shared/types";
import { generateGeminiJson, hasGeminiKey } from "./gemini";
import { gapAnalysisPrompt } from "./prompts";
import { gapAnalysisSchema } from "./schemas";
import { recommendBridgeLabs } from "./bridgeLabs";

const analysisCopy: Record<Locale, {
  safetyNote: string;
  candidate: string;
  fallbackSkill: string;
  fallbackProjectFocus: string;
  fallbackImprovement: string;
  risks: {
    communication: string;
    motivation: string;
    collaboration: string;
  };
  feedback: string[];
  tags: {
    roleReady: string;
    roleProofNeeded: string;
    reportingReady: string;
    communicationBuilding: string;
    collaborationReady: string;
    collaborationNeeded: string;
  };
}> = {
  en: {
    safetyNote: "BridgePass provides structured career guidance, not final hiring decisions.",
    candidate: "the candidate",
    fallbackSkill: "software development",
    fallbackProjectFocus: "building practical software and explaining my work clearly",
    fallbackImprovement: "Japanese technical communication and role-specific proof",
    risks: {
      communication: "Japanese workplace reporting evidence is not yet clear.",
      motivation: "Motivation may need stronger product, company, or role specificity.",
      collaboration: "Teamwork and cross-border collaboration proof may be too thin."
    },
    feedback: [
      "State the target role and strongest project evidence earlier.",
      "Connect motivation to product, company, or market context.",
      "Add one concrete teamwork or reporting example."
    ],
    tags: {
      roleReady: "ready signal",
      roleProofNeeded: "Role-specific proof needed",
      reportingReady: "Japanese reporting practice",
      communicationBuilding: "Communication readiness building",
      collaborationReady: "Team collaboration evidence",
      collaborationNeeded: "Collaboration proof needed"
    }
  },
  ko: {
    safetyNote: "BridgePass는 최종 채용 판단이 아니라 구조화된 커리어 가이드를 제공합니다.",
    candidate: "지원자",
    fallbackSkill: "소프트웨어 개발",
    fallbackProjectFocus: "실제 소프트웨어를 만들고 작업 내용을 명확히 설명하는 것",
    fallbackImprovement: "일본어 기술 커뮤니케이션과 직무별 증빙",
    risks: {
      communication: "일본 업무 환경에서의 보고 역량 증빙이 아직 명확하지 않습니다.",
      motivation: "지원 동기를 제품, 회사, 직무 맥락에 더 구체적으로 연결할 필요가 있습니다.",
      collaboration: "팀워크와 한일 협업 증빙이 아직 부족해 보일 수 있습니다."
    },
    feedback: [
      "목표 직무와 가장 강한 프로젝트 증빙을 더 앞에 배치하세요.",
      "지원 동기를 제품, 회사, 시장 맥락과 연결하세요.",
      "팀워크 또는 보고 경험을 하나의 구체적 사례로 추가하세요."
    ],
    tags: {
      roleReady: "준비 시그널",
      roleProofNeeded: "직무별 증빙 필요",
      reportingReady: "일본어 보고 연습 경험",
      communicationBuilding: "커뮤니케이션 준비도 보완 필요",
      collaborationReady: "팀 협업 증빙",
      collaborationNeeded: "협업 증빙 필요"
    }
  },
  ja: {
    safetyNote: "BridgePassは最終的な採用判断ではなく、構造化されたキャリアガイダンスを提供します。",
    candidate: "候補者",
    fallbackSkill: "ソフトウェア開発",
    fallbackProjectFocus: "実用的なソフトウェアを作り、自分の作業を明確に説明すること",
    fallbackImprovement: "日本語での技術コミュニケーションと職種別エビデンス",
    risks: {
      communication: "日本の職場で求められる報告力の証拠がまだ明確ではありません。",
      motivation: "志望動機をプロダクト、会社、職種の文脈により具体的につなげる必要があります。",
      collaboration: "チームワークと韓日協業の証拠がまだ薄く見える可能性があります。"
    },
    feedback: [
      "対象職種と最も強いプロジェクト証拠をより前に置いてください。",
      "志望動機をプロダクト、会社、市場文脈につなげてください。",
      "チームワークまたは報告経験を具体例として1つ追加してください。"
    ],
    tags: {
      roleReady: "準備シグナル",
      roleProofNeeded: "職種別の証拠が必要",
      reportingReady: "日本語報告の練習経験",
      communicationBuilding: "コミュニケーション準備度の補強が必要",
      collaborationReady: "チーム協業の証拠",
      collaborationNeeded: "協業証拠が必要"
    }
  }
};

function resolveLocale(locale?: Locale): Locale {
  return locale === "ko" || locale === "ja" ? locale : "en";
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function calculateOverall(result: Pick<
  GapAnalysisResult,
  | "technicalFitScore"
  | "communicationFitScore"
  | "motivationFitScore"
  | "collaborationEvidenceScore"
  | "evidenceConfidenceScore"
>): number {
  return clampScore(
    result.technicalFitScore * 0.15 +
      result.communicationFitScore * 0.25 +
      result.motivationFitScore * 0.2 +
      result.collaborationEvidenceScore * 0.25 +
      result.evidenceConfidenceScore * 0.15
  );
}

function textForProfile(profile: DeveloperProfile): string {
  return [
    profile.techStack,
    profile.languageLevels,
    profile.projectExperience,
    profile.selfIntroduction,
    profile.motivation,
    profile.anxiety
  ]
    .join(" ")
    .toLowerCase();
}

function matchesSignal(profileText: string, signal: string): boolean {
  const normalized = signal.toLowerCase();
  const words = normalized
    .split(/[^a-z0-9+#.]+/i)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3);

  if (!words.length) return false;
  return words.some((word) => profileText.includes(word));
}

function scoreSignals(profileText: string, signals: string[]): number {
  if (!signals.length) return 60;
  const hits = signals.filter((signal) => matchesSignal(profileText, signal)).length;
  return clampScore(35 + (hits / signals.length) * 65);
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function buildRewrite(profile: DeveloperProfile, baseline: RoleBaseline, locale: Locale): string {
  const copy = analysisCopy[locale];
  const firstSkill = profile.techStack.split(",")[0]?.trim() || baseline.technicalBaseline[0] || copy.fallbackSkill;

  if (locale === "ko") {
    return `안녕하세요, 저는 ${profile.name || copy.candidate}입니다. ${profile.targetCountry}의 ${profile.targetRole} 직무를 목표로 준비하고 있으며, ${firstSkill} 경험을 가지고 있습니다. 최근 프로젝트에서는 ${profile.projectExperience || copy.fallbackProjectFocus}에 집중했습니다. 일본 개발팀이 기대하는 명확한 보고, 팀워크 증빙, 구체적인 프로젝트 결과로 제 기술 경험을 설명하고 싶습니다. 다음 개선 영역은 ${profile.anxiety || copy.fallbackImprovement}입니다.`;
  }

  if (locale === "ja") {
    return `こんにちは、${profile.name || copy.candidate}です。${profile.targetCountry}の${profile.targetRole}職を目指しており、${firstSkill}の経験があります。最近のプロジェクトでは、${profile.projectExperience || copy.fallbackProjectFocus}に取り組みました。明確な報告、チームワークの証拠、具体的な成果を通じて、日本の開発チームが期待する形で自分の技術経験を伝えたいと考えています。次に強化したい点は、${profile.anxiety || copy.fallbackImprovement}です。`;
  }

  return `Hello, my name is ${profile.name || copy.candidate}. I am targeting a ${profile.targetRole} role in ${profile.targetCountry}, with experience in ${firstSkill}. In my recent projects, I focused on ${profile.projectExperience || copy.fallbackProjectFocus}. I want to connect my technical work with Japanese team expectations by showing clear reports, teamwork evidence, and concrete project outcomes. My next improvement area is to strengthen ${profile.anxiety || copy.fallbackImprovement}.`;
}

function buildFallbackAnalysis(profile: DeveloperProfile, baseline: RoleBaseline): GapAnalysisResult {
  const locale = resolveLocale(profile.uiLocale);
  const copy = analysisCopy[locale];
  const profileText = textForProfile(profile);
  const technicalFitScore = scoreSignals(profileText, baseline.technicalBaseline);
  const communicationFitScore = clampScore(
    35 +
      (hasAny(profileText, [/japanese|jlpt|n[1-5]|일본어|日本語/i]) ? 20 : 0) +
      (hasAny(profileText, [/report|explain|documentation|readme|issue|보고|설명|문서|이슈|報告|説明|ドキュメント|課題/i]) ? 25 : 0) +
      (hasAny(profileText, [/delay|blocked|decision|requirement|지연|막힘|결정|요구사항|遅延|詰ま|判断|要件/i]) ? 20 : 0)
  );
  const motivationFitScore = clampScore(
    35 +
      (profile.motivation.length > 80 ? 20 : 0) +
      (hasAny(profile.motivation.toLowerCase(), [/product|company|market|role|customer|saas|japan|제품|회사|시장|직무|고객|일본|プロダクト|会社|市場|職種|顧客|日本/i]) ? 30 : 0) +
      (hasAny(profile.motivation.toLowerCase(), [/culture|anime|travel|문화|애니|여행|文化|アニメ|旅行/i]) ? -10 : 0)
  );
  const collaborationEvidenceScore = clampScore(
    30 +
      (hasAny(profileText, [/team|collaborat|designer|developer|review|팀|협업|동료|디자이너|개발자|리뷰|チーム|協業|共同|デザイナー|開発者|レビュー/i]) ? 25 : 0) +
      (hasAny(profileText, [/pull request|github|issue|merge/i]) ? 25 : 0) +
      (hasAny(profileText, [/korea-japan|cross-border|japanese teammate|global|한일|국경|일본 팀원|글로벌|韓日|越境|日本人メンバー|グローバル/i]) ? 20 : 0)
  );
  const evidenceConfidenceScore = clampScore(
    30 +
      (hasAny(profileText, [/github|portfolio|readme|포트폴리오|ポートフォリオ/i]) ? 20 : 0) +
      (hasAny(profileText, [/deployed|demo|metrics|test|coverage|배포|데모|지표|테스트|커버리지|デプロイ|デモ|指標|テスト|カバレッジ/i]) ? 25 : 0) +
      (hasAny(profileText, [/review|endorsed|feedback|verified|리뷰|피드백|검증|レビュー|フィードバック|検証/i]) ? 15 : 0)
  );

  const allSignals = [
    ...baseline.technicalBaseline,
    ...baseline.communicationBaseline,
    ...baseline.softSkillBaseline,
    ...baseline.motivationBaseline,
    ...baseline.evidenceBaseline
  ];
  const matchedSignals = allSignals.filter((signal) => matchesSignal(profileText, signal)).slice(0, 12);
  const missingSignals = allSignals.filter((signal) => !matchesSignal(profileText, signal)).slice(0, 12);
  const risks = [
    ...baseline.commonRisks.filter((risk) => !matchesSignal(profileText, risk)),
    communicationFitScore < 65 ? copy.risks.communication : "",
    motivationFitScore < 65 ? copy.risks.motivation : "",
    collaborationEvidenceScore < 65 ? copy.risks.collaboration : ""
  ].filter(Boolean);
  const recommendedActions = recommendBridgeLabs(missingSignals, risks, profile.targetRole, locale);

  const result: GapAnalysisResult = {
    overallFitScore: 0,
    technicalFitScore,
    communicationFitScore,
    motivationFitScore,
    collaborationEvidenceScore,
    evidenceConfidenceScore,
    matchedSignals,
    missingSignals,
    risks: risks.slice(0, 8),
    recruiterLensFeedback: copy.feedback,
    rewrittenSelfIntroduction: buildRewrite(profile, baseline, locale),
    suggestedTags: [
      technicalFitScore >= 65 ? `${profile.targetRole} ${copy.tags.roleReady}` : copy.tags.roleProofNeeded,
      communicationFitScore >= 65 ? copy.tags.reportingReady : copy.tags.communicationBuilding,
      collaborationEvidenceScore >= 65 ? copy.tags.collaborationReady : copy.tags.collaborationNeeded
    ],
    recommendedActions,
    recommendedBridgeLabs: recommendedActions,
    safetyNote: copy.safetyNote
  };
  result.overallFitScore = calculateOverall(result);
  return result;
}

function normalizeGapResult(
  profile: DeveloperProfile,
  baseline: RoleBaseline,
  result: GapAnalysisResult
): GapAnalysisResult {
  const locale = resolveLocale(profile.uiLocale);
  const copy = analysisCopy[locale];
  const risks = result.risks ?? [];
  const missingSignals = result.missingSignals ?? [];
  const recommended = (result.recommendedBridgeLabs?.length
    ? result.recommendedBridgeLabs
    : result.recommendedActions) as BridgeLabRecommendation[] | undefined;
  const recommendedBridgeLabs = recommended?.length
    ? recommended
    : recommendBridgeLabs(missingSignals, risks, profile.targetRole, locale);

  const normalized: GapAnalysisResult = {
    overallFitScore: 0,
    technicalFitScore: clampScore(result.technicalFitScore),
    communicationFitScore: clampScore(result.communicationFitScore),
    motivationFitScore: clampScore(result.motivationFitScore),
    collaborationEvidenceScore: clampScore(result.collaborationEvidenceScore),
    evidenceConfidenceScore: clampScore(result.evidenceConfidenceScore),
    matchedSignals: result.matchedSignals ?? [],
    missingSignals,
    risks,
    recruiterLensFeedback: result.recruiterLensFeedback ?? [],
    rewrittenSelfIntroduction: result.rewrittenSelfIntroduction || buildRewrite(profile, baseline, locale),
    suggestedTags: result.suggestedTags ?? [],
    recommendedActions: result.recommendedActions?.length ? result.recommendedActions : recommendedBridgeLabs,
    recommendedBridgeLabs,
    safetyNote: result.safetyNote || copy.safetyNote
  };
  normalized.overallFitScore = calculateOverall(normalized);
  return normalized;
}

export async function analyzeDeveloperProfile(
  profile: DeveloperProfile,
  baseline: RoleBaseline
): Promise<GapAnalysisResult> {
  if (hasGeminiKey()) {
    try {
      const result = await generateGeminiJson<GapAnalysisResult>({
        prompt: gapAnalysisPrompt(profile, baseline),
        schema: gapAnalysisSchema,
        temperature: 0.25
      });
      return normalizeGapResult(profile, baseline, result);
    } catch (error) {
      console.warn("Gemini profile analysis failed; using fallback.", error);
    }
  }
  return buildFallbackAnalysis(profile, baseline);
}
