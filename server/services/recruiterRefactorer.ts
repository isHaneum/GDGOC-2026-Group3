import type { DeveloperProfile, Locale, RecruiterLensResult, RoleBaseline } from "../../shared/types";
import { generateGeminiJson, hasGeminiKey } from "./gemini";
import { recruiterLensPrompt } from "./prompts";
import { recruiterLensSchema } from "./schemas";

const recruiterCopy: Record<Locale, {
  safetyNote: string;
  candidate: string;
  defaultMotivation: string;
  explanation: string[];
  missingElements: string[];
}> = {
  en: {
    safetyNote: "BridgePass provides structured career guidance, not final hiring decisions.",
    candidate: "the candidate",
    defaultMotivation: "I want to grow in a Japanese IT team where I can connect technical work with user value.",
    explanation: [
      "The rewrite starts with target role and relevant technical area.",
      "It connects project experience to contribution and communication.",
      "It keeps motivation concrete without adding facts that were not provided."
    ],
    missingElements: [
      "Specific project outcome or metric",
      "Concrete teamwork example",
      "Japanese reporting or documentation evidence"
    ]
  },
  ko: {
    safetyNote: "BridgePass는 최종 채용 판단이 아니라 구조화된 커리어 가이드를 제공합니다.",
    candidate: "지원자",
    defaultMotivation: "기술 작업을 사용자 가치와 연결할 수 있는 일본 IT 팀에서 성장하고 싶습니다.",
    explanation: [
      "목표 직무와 관련 기술 영역을 먼저 보여주도록 정리했습니다.",
      "프로젝트 경험을 기여도와 커뮤니케이션 역량으로 연결했습니다.",
      "제공되지 않은 사실을 추가하지 않고 지원 동기를 더 구체적으로 만들었습니다."
    ],
    missingElements: [
      "구체적인 프로젝트 결과 또는 지표",
      "명확한 팀워크 사례",
      "일본어 보고 또는 문서화 증빙"
    ]
  },
  ja: {
    safetyNote: "BridgePassは最終的な採用判断ではなく、構造化されたキャリアガイダンスを提供します。",
    candidate: "候補者",
    defaultMotivation: "技術的な仕事をユーザー価値につなげられる日本のITチームで成長したいです。",
    explanation: [
      "対象職種と関連する技術領域が先に伝わるように整理しました。",
      "プロジェクト経験を貢献度とコミュニケーション力につなげました。",
      "提供されていない事実を追加せず、志望動機をより具体的にしました。"
    ],
    missingElements: [
      "具体的なプロジェクト成果または指標",
      "明確なチームワーク事例",
      "日本語での報告またはドキュメント作成の証拠"
    ]
  }
};

function fallbackRewrite(profile: DeveloperProfile, baseline: RoleBaseline): RecruiterLensResult {
  const locale = profile.uiLocale === "ko" || profile.uiLocale === "ja" ? profile.uiLocale : "en";
  const copy = recruiterCopy[locale];
  const role = profile.targetRole || baseline.role;
  const evidence = profile.projectExperience || "my project experience";
  const motivation = profile.motivation || copy.defaultMotivation;

  const rewrittenSelfIntroduction =
    locale === "ko"
      ? `안녕하세요, 저는 ${profile.name || copy.candidate}입니다. ${profile.targetCountry}의 ${role} 직무를 준비하고 있습니다. 주요 기술 경험은 ${profile.techStack || baseline.technicalBaseline.join(", ")}입니다. ${evidence}에서 저는 책임 범위를 명확히 하고, 진행 상황을 공유하며, 구현 판단을 프로젝트 목표와 연결하는 데 집중했습니다. 지원 동기는 ${motivation} 일본 업무 환경에서 신뢰를 줄 수 있도록 보고서, 프로젝트 문서, 협업 이력 같은 구체적 증빙을 더 강화하고 싶습니다.`
      : locale === "ja"
        ? `こんにちは、${profile.name || copy.candidate}です。${profile.targetCountry}の${role}職を目指して準備しています。主な技術経験は${profile.techStack || baseline.technicalBaseline.join(", ")}です。${evidence}では、自分の責任範囲を明確にし、進捗を共有し、実装判断をプロジェクト目標につなげることに注力しました。志望動機は、${motivation} 日本の職場で信頼を得られるよう、報告書、プロジェクトドキュメント、協業履歴などの具体的な証拠をさらに強化したいです。`
        : `Hello, my name is ${profile.name || copy.candidate}. I am preparing for a ${role} role in ${profile.targetCountry}. My main technical experience is ${profile.techStack || baseline.technicalBaseline.join(", ")}. In ${evidence}, I focused on clarifying my responsibility, communicating progress, and connecting implementation decisions to the project goal. My motivation is ${motivation}. I would like to strengthen my Japanese workplace communication by showing concrete evidence such as reports, project documentation, and collaboration history.`;

  return {
    originalSelfIntroduction: profile.selfIntroduction,
    rewrittenSelfIntroduction,
    explanation: copy.explanation,
    missingElements: copy.missingElements,
    safetyNote: copy.safetyNote
  };
}

export async function refactorForRecruiterLens(
  profile: DeveloperProfile,
  baseline: RoleBaseline
): Promise<RecruiterLensResult> {
  const locale = profile.uiLocale === "ko" || profile.uiLocale === "ja" ? profile.uiLocale : "en";
  if (hasGeminiKey()) {
    try {
      const result = await generateGeminiJson<RecruiterLensResult>({
        prompt: recruiterLensPrompt(profile, baseline),
        schema: recruiterLensSchema,
        temperature: 0.25
      });
      return {
        originalSelfIntroduction: result.originalSelfIntroduction || profile.selfIntroduction,
        rewrittenSelfIntroduction: result.rewrittenSelfIntroduction,
        explanation: result.explanation ?? [],
        missingElements: result.missingElements ?? [],
        safetyNote: result.safetyNote || recruiterCopy[locale].safetyNote
      };
    } catch (error) {
      console.warn("Gemini recruiter refactor failed; using fallback.", error);
    }
  }
  return fallbackRewrite(profile, baseline);
}
