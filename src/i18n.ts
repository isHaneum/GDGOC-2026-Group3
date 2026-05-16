import type { DeveloperProfile, Locale } from "../shared/types";

export const localeOptions: Array<{ value: Locale; label: string }> = [
  { value: "en", label: "English" },
  { value: "ko", label: "한국어" },
  { value: "ja", label: "日本語" }
];

export const defaultProfiles: Record<Locale, DeveloperProfile> = {
  en: {
    name: "Minji Kim",
    nationality: "Korean",
    targetCountry: "Japan",
    targetRole: "Junior Frontend Developer",
    techStack: "React, TypeScript, Vite, Tailwind CSS, REST API",
    languageLevels: "Korean native, Japanese JLPT N3, English reading",
    projectExperience:
      "Built a task dashboard with React and TypeScript, integrated REST APIs, wrote a README, and used GitHub pull requests with two teammates.",
    selfIntroduction:
      "I am a junior frontend developer who likes building web services. I studied React and TypeScript and want to work in Japan because I am interested in Japanese products.",
    motivation:
      "I want to join a Japanese SaaS team where frontend quality, clear UI, and teamwork are important. I am interested in learning how Japanese teams communicate product requirements and improve user workflows.",
    anxiety:
      "I am worried about Japanese meeting communication and explaining delays clearly.",
    uiLocale: "en"
  },
  ko: {
    name: "김민지",
    nationality: "한국",
    targetCountry: "Japan",
    targetRole: "Junior Frontend Developer",
    techStack: "React, TypeScript, Vite, Tailwind CSS, REST API",
    languageLevels: "한국어 모국어, 일본어 JLPT N3, 영어 문서 읽기 가능",
    projectExperience:
      "React와 TypeScript로 업무 관리 대시보드를 만들고 REST API를 연동했습니다. README를 작성했고 두 명의 팀원과 GitHub pull request로 협업했습니다.",
    selfIntroduction:
      "저는 웹 서비스를 만드는 것을 좋아하는 주니어 프론트엔드 개발자입니다. React와 TypeScript를 공부했고 일본 제품에 관심이 있어 일본에서 일하고 싶습니다.",
    motivation:
      "프론트엔드 품질, 명확한 UI, 팀워크를 중요하게 보는 일본 SaaS 팀에서 일하고 싶습니다. 일본 개발팀이 제품 요구사항을 소통하고 사용자 흐름을 개선하는 방식을 배우고 싶습니다.",
    anxiety:
      "일본어 회의 커뮤니케이션과 일정 지연을 명확히 보고하는 부분이 걱정됩니다.",
    uiLocale: "ko"
  },
  ja: {
    name: "キム・ミンジ",
    nationality: "韓国",
    targetCountry: "Japan",
    targetRole: "Junior Frontend Developer",
    techStack: "React, TypeScript, Vite, Tailwind CSS, REST API",
    languageLevels: "韓国語ネイティブ、日本語 JLPT N3、英語ドキュメント読解",
    projectExperience:
      "ReactとTypeScriptでタスク管理ダッシュボードを開発し、REST APIを連携しました。READMEを作成し、2名のチームメンバーとGitHubのpull requestで協業しました。",
    selfIntroduction:
      "私はWebサービスを作ることが好きなジュニアフロントエンド開発者です。ReactとTypeScriptを学び、日本のプロダクトに関心があるため日本で働きたいと考えています。",
    motivation:
      "フロントエンド品質、分かりやすいUI、チームワークを重視する日本のSaaSチームで働きたいです。日本の開発チームがプロダクト要件を共有し、ユーザーフローを改善する方法を学びたいです。",
    anxiety:
      "日本語での会議コミュニケーションと、遅延を明確に報告することに不安があります。",
    uiLocale: "ja"
  }
};

const roleLabels: Record<Locale, Record<string, string>> = {
  en: {},
  ko: {
    "Junior Frontend Developer": "주니어 프론트엔드 개발자",
    "Backend Developer": "백엔드 개발자",
    "AI / Machine Learning Engineer": "AI / 머신러닝 엔지니어",
    "Cyber Security": "사이버 보안",
    "General Japanese IT interview review": "일본 IT 면접 일반 리뷰",
    "Korean applicant concern about Japanese IT hiring": "한국 지원자의 일본 IT 채용 고민"
  },
  ja: {
    "Junior Frontend Developer": "ジュニアフロントエンド開発者",
    "Backend Developer": "バックエンド開発者",
    "AI / Machine Learning Engineer": "AI / 機械学習エンジニア",
    "Cyber Security": "サイバーセキュリティ",
    "General Japanese IT interview review": "日本IT面接の一般レビュー",
    "Korean applicant concern about Japanese IT hiring": "韓国応募者の日本IT採用に関する不安"
  }
};

export function formatRole(role: string, locale: Locale): string {
  return roleLabels[locale][role] ?? role;
}

export const countryOptionsByLocale: Record<Locale, Array<{ value: "Japan" | "Korea"; label: string }>> = {
  en: [
    { value: "Japan", label: "Japan" },
    { value: "Korea", label: "Korea" }
  ],
  ko: [
    { value: "Japan", label: "일본" },
    { value: "Korea", label: "한국" }
  ],
  ja: [
    { value: "Japan", label: "日本" },
    { value: "Korea", label: "韓国" }
  ]
};

export const sourceTypeLabels: Record<Locale, Record<string, string>> = {
  en: {
    job_posting: "job posting",
    career_review: "career review",
    community_post: "community post"
  },
  ko: {
    job_posting: "채용 공고",
    career_review: "커리어 리뷰",
    community_post: "커뮤니티 글"
  },
  ja: {
    job_posting: "求人情報",
    career_review: "キャリアレビュー",
    community_post: "コミュニティ投稿"
  }
};

export const copy = {
  en: {
    nav: {
      dashboard: "Dashboard",
      signals: "Signals",
      profile: "Profile",
      analysis: "Analysis",
      recruiter: "Recruiter Lens",
      passport: "Passport"
    },
    language: "Language",
    appTitle: "Career Signal Engine",
    hackathon: "Hackathon MVP",
    dashboardTitle: "BridgePass Career Signal Engine",
    cards: {
      load: "Load Sample Data",
      extract: "Extract Hiring Signals",
      baseline: "Build Role Baseline",
      sampleSuffix: "sample records available",
      signalSuffix: "structured signals created",
      baselineSuffix: "role baselines ready"
    },
    productMessage: "Product Message",
    productMessages: [
      "LinkedIn shows profiles.",
      "Mynavi shows job postings.",
      "Stack Overflow solves technical questions.",
      "Generic AI agents give advice.",
      "BridgePass extracts real hiring signals.",
      "BridgePass turns gaps into proof-building action plans."
    ],
    pipelineStatus: "Pipeline Status",
    status: {
      raw: "Raw sample records",
      signals: "Extracted signals",
      baselines: "Role baselines",
      latest: "Latest analysis"
    },
    buttons: {
      extract: "Extract",
      baseline: "Baseline",
      analyze: "Analyze",
      recruiterLens: "Recruiter Lens",
      refreshAnalysis: "Refresh Analysis",
      refactor: "Refactor"
    },
    signals: {
      title: "Sample Data / Signals View",
      eyebrow: "Signal workspace",
      raw: "Raw Sample Records",
      extracted: "Extracted Hiring Signals",
      roleBaseline: "Role Baseline",
      requiredTech: "Required technical skills",
      recommendedEvidence: "Recommended evidence",
      commonConcerns: "Common concerns",
      technicalBaseline: "Technical baseline",
      communicationBaseline: "Communication baseline",
      softSkillBaseline: "Soft skill baseline",
      motivationBaseline: "Motivation baseline",
      evidenceBaseline: "Evidence baseline",
      commonRisks: "Common risks"
    },
    profile: {
      title: "Developer Profile Input",
      eyebrow: "Candidate workspace",
      name: "Name",
      nationality: "Nationality",
      targetCountry: "Target country",
      targetRole: "Target role",
      techStack: "Tech stack",
      languageLevels: "Language levels",
      projectExperience: "Project experience",
      selfIntroduction: "Self-introduction",
      motivation: "Motivation",
      anxiety: "Anxiety"
    },
    analysis: {
      title: "Gap Analysis Result",
      overall: "Overall fit",
      technical: "Technical fit",
      communication: "Communication fit",
      motivation: "Motivation fit",
      evidence: "Evidence confidence",
      matched: "Matched signals",
      suggestedTags: "Suggested tags",
      missing: "Missing signals",
      risks: "Risks",
      recommendedActions: "Recommended Actions"
    },
    recruiter: {
      title: "Recruiter Lens Feedback",
      original: "Original self-introduction",
      rewritten: "Japanese recruiter version",
      changed: "What changed",
      missing: "Missing elements"
    },
    passport: {
      title: "Collaboration Passport Preview",
      eyebrow: "Company-visible proof",
      applicantTargeting: "applicant targeting",
      targetRole: "Target role",
      evidenceLevel: "Evidence level",
      recommendedNextStep: "Recommended next step",
      baselineSources: "Baseline sources",
      samples: "samples",
      verifiedTags: "Verified / suggested tags",
      strengths: "Strengths",
      risks: "Risks",
      summary: "Candidate summary",
      nextSteps: {
        officeTour: "office tour",
        casualInterview: "casual interview",
        trialProject: "trial project",
        studyFirst: "study activity first"
      }
    },
    empty: {
      noneYet: "None yet",
      samples: "Load sample data to inspect records.",
      signals: "Extract hiring signals to view structured records.",
      baseline: "Build a role baseline to inspect aggregated expectations.",
      analysis: "Analyze a developer profile to generate scores and recommendations.",
      recruiter: "Run Recruiter Lens to rewrite the self-introduction.",
      passport: "Analyze a profile to generate a Collaboration Passport.",
      recommendations: "No recommended activities yet."
    },
    recommendations: {
      outcome: "Outcome:",
      proof: "Proof:"
    },
    errorFallback: "Something went wrong."
  },
  ko: {
    nav: {
      dashboard: "대시보드",
      signals: "시그널",
      profile: "프로필",
      analysis: "분석",
      recruiter: "리크루터 렌즈",
      passport: "패스포트"
    },
    language: "언어",
    appTitle: "커리어 시그널 엔진",
    hackathon: "해커톤 MVP",
    dashboardTitle: "BridgePass 커리어 시그널 엔진",
    cards: {
      load: "샘플 데이터 불러오기",
      extract: "채용 시그널 추출",
      baseline: "직무 기준선 만들기",
      sampleSuffix: "개의 샘플 레코드",
      signalSuffix: "개의 구조화 시그널",
      baselineSuffix: "개의 직무 기준선"
    },
    productMessage: "제품 메시지",
    productMessages: [
      "LinkedIn은 프로필을 보여줍니다.",
      "Mynavi는 채용 공고를 보여줍니다.",
      "Stack Overflow는 기술 질문을 해결합니다.",
      "일반 AI 에이전트는 조언을 제공합니다.",
      "BridgePass는 실제 채용 시그널을 추출합니다.",
      "BridgePass는 격차를 증명 가능한 액션 플랜으로 바꿉니다."
    ],
    pipelineStatus: "파이프라인 상태",
    status: {
      raw: "원본 샘플 레코드",
      signals: "추출된 시그널",
      baselines: "직무 기준선",
      latest: "최근 분석"
    },
    buttons: {
      extract: "추출",
      baseline: "기준선",
      analyze: "분석",
      recruiterLens: "리크루터 렌즈",
      refreshAnalysis: "분석 새로고침",
      refactor: "리팩터"
    },
    signals: {
      title: "샘플 데이터 / 시그널 보기",
      eyebrow: "시그널 워크스페이스",
      raw: "원본 샘플 레코드",
      extracted: "추출된 채용 시그널",
      roleBaseline: "직무 기준선",
      requiredTech: "필수 기술 역량",
      recommendedEvidence: "추천 증빙",
      commonConcerns: "공통 우려",
      technicalBaseline: "기술 기준선",
      communicationBaseline: "커뮤니케이션 기준선",
      softSkillBaseline: "소프트 스킬 기준선",
      motivationBaseline: "지원 동기 기준선",
      evidenceBaseline: "증빙 기준선",
      commonRisks: "공통 리스크"
    },
    profile: {
      title: "개발자 프로필 입력",
      eyebrow: "지원자 워크스페이스",
      name: "이름",
      nationality: "국적",
      targetCountry: "목표 국가",
      targetRole: "목표 직무",
      techStack: "기술 스택",
      languageLevels: "언어 수준",
      projectExperience: "프로젝트 경험",
      selfIntroduction: "자기소개",
      motivation: "지원 동기",
      anxiety: "걱정되는 점"
    },
    analysis: {
      title: "격차 분석 결과",
      overall: "종합 적합도",
      technical: "기술 적합도",
      communication: "커뮤니케이션 적합도",
      motivation: "동기 적합도",
      evidence: "증빙 신뢰도",
      matched: "일치하는 시그널",
      suggestedTags: "추천 태그",
      missing: "부족한 시그널",
      risks: "리스크",
      recommendedActions: "추천 액션"
    },
    recruiter: {
      title: "리크루터 렌즈 피드백",
      original: "원본 자기소개",
      rewritten: "일본 IT 리크루터용 버전",
      changed: "개선된 점",
      missing: "보완 요소"
    },
    passport: {
      title: "협업 패스포트 미리보기",
      eyebrow: "기업이 볼 수 있는 증빙",
      applicantTargeting: "지원자 · 목표 국가",
      targetRole: "목표 직무",
      evidenceLevel: "증빙 수준",
      recommendedNextStep: "기업 추천 다음 단계",
      baselineSources: "기준선 샘플 수",
      samples: "개 샘플",
      verifiedTags: "검증 / 추천 태그",
      strengths: "강점",
      risks: "리스크",
      summary: "지원자 요약",
      nextSteps: {
        officeTour: "오피스 투어",
        casualInterview: "캐주얼 면담",
        trialProject: "트라이얼 프로젝트",
        studyFirst: "학습 활동 먼저"
      }
    },
    empty: {
      noneYet: "아직 없습니다",
      samples: "샘플 데이터를 불러오면 레코드를 확인할 수 있습니다.",
      signals: "채용 시그널을 추출하면 구조화된 결과를 볼 수 있습니다.",
      baseline: "직무 기준선을 만들면 집계된 기대치를 확인할 수 있습니다.",
      analysis: "개발자 프로필을 분석하면 점수와 추천 액션이 생성됩니다.",
      recruiter: "리크루터 렌즈를 실행하면 자기소개를 개선할 수 있습니다.",
      passport: "프로필을 분석하면 협업 패스포트를 만들 수 있습니다.",
      recommendations: "아직 추천 활동이 없습니다."
    },
    recommendations: {
      outcome: "기대 결과:",
      proof: "생성 증빙:"
    },
    errorFallback: "문제가 발생했습니다."
  },
  ja: {
    nav: {
      dashboard: "ダッシュボード",
      signals: "シグナル",
      profile: "プロフィール",
      analysis: "分析",
      recruiter: "リクルーターレンズ",
      passport: "パスポート"
    },
    language: "言語",
    appTitle: "キャリアシグナルエンジン",
    hackathon: "ハッカソンMVP",
    dashboardTitle: "BridgePass キャリアシグナルエンジン",
    cards: {
      load: "サンプルデータ読込",
      extract: "採用シグナル抽出",
      baseline: "職種基準を作成",
      sampleSuffix: "件のサンプルレコード",
      signalSuffix: "件の構造化シグナル",
      baselineSuffix: "件の職種基準"
    },
    productMessage: "プロダクトメッセージ",
    productMessages: [
      "LinkedInはプロフィールを見せます。",
      "Mynaviは求人情報を見せます。",
      "Stack Overflowは技術質問を解決します。",
      "一般的なAIエージェントは助言をします。",
      "BridgePassは実際の採用シグナルを抽出します。",
      "BridgePassはギャップを証明可能な行動計画に変えます。"
    ],
    pipelineStatus: "パイプライン状況",
    status: {
      raw: "元サンプルレコード",
      signals: "抽出済みシグナル",
      baselines: "職種基準",
      latest: "最新分析"
    },
    buttons: {
      extract: "抽出",
      baseline: "基準作成",
      analyze: "分析",
      recruiterLens: "リクルーターレンズ",
      refreshAnalysis: "分析を更新",
      refactor: "リファクター"
    },
    signals: {
      title: "サンプルデータ / シグナル表示",
      eyebrow: "シグナルワークスペース",
      raw: "元サンプルレコード",
      extracted: "抽出された採用シグナル",
      roleBaseline: "職種基準",
      requiredTech: "必須技術スキル",
      recommendedEvidence: "推奨エビデンス",
      commonConcerns: "共通の懸念",
      technicalBaseline: "技術基準",
      communicationBaseline: "コミュニケーション基準",
      softSkillBaseline: "ソフトスキル基準",
      motivationBaseline: "志望動機基準",
      evidenceBaseline: "エビデンス基準",
      commonRisks: "共通リスク"
    },
    profile: {
      title: "開発者プロフィール入力",
      eyebrow: "候補者ワークスペース",
      name: "名前",
      nationality: "国籍",
      targetCountry: "対象国",
      targetRole: "対象職種",
      techStack: "技術スタック",
      languageLevels: "言語レベル",
      projectExperience: "プロジェクト経験",
      selfIntroduction: "自己紹介",
      motivation: "志望動機",
      anxiety: "不安点"
    },
    analysis: {
      title: "ギャップ分析結果",
      overall: "総合適合度",
      technical: "技術適合度",
      communication: "コミュニケーション適合度",
      motivation: "動機適合度",
      evidence: "エビデンス信頼度",
      matched: "一致したシグナル",
      suggestedTags: "推奨タグ",
      missing: "不足シグナル",
      risks: "リスク",
      recommendedActions: "推奨アクション"
    },
    recruiter: {
      title: "リクルーターレンズフィードバック",
      original: "元の自己紹介",
      rewritten: "日本ITリクルーター向け版",
      changed: "改善点",
      missing: "不足要素"
    },
    passport: {
      title: "コラボレーションパスポートプレビュー",
      eyebrow: "企業に見せられる証明",
      applicantTargeting: "応募者 · 対象国",
      targetRole: "対象職種",
      evidenceLevel: "エビデンスレベル",
      recommendedNextStep: "企業向け次の推奨ステップ",
      baselineSources: "基準サンプル数",
      samples: "件のサンプル",
      verifiedTags: "検証 / 推奨タグ",
      strengths: "強み",
      risks: "リスク",
      summary: "候補者サマリー",
      nextSteps: {
        officeTour: "オフィスツアー",
        casualInterview: "カジュアル面談",
        trialProject: "トライアルプロジェクト",
        studyFirst: "学習活動を先に実施"
      }
    },
    empty: {
      noneYet: "まだありません",
      samples: "サンプルデータを読み込むとレコードを確認できます。",
      signals: "採用シグナルを抽出すると構造化された結果を確認できます。",
      baseline: "職種基準を作成すると集計された期待値を確認できます。",
      analysis: "開発者プロフィールを分析するとスコアと推奨アクションが生成されます。",
      recruiter: "リクルーターレンズを実行すると自己紹介を改善できます。",
      passport: "プロフィールを分析するとコラボレーションパスポートを生成できます。",
      recommendations: "推奨活動はまだありません。"
    },
    recommendations: {
      outcome: "期待成果:",
      proof: "作成される証明:"
    },
    errorFallback: "問題が発生しました。"
  }
} satisfies Record<Locale, Record<string, unknown>>;

export type AppCopy = typeof copy.en;

export function getCopy(locale: Locale): AppCopy {
  return copy[locale] as AppCopy;
}

export function isDefaultProfile(profile: DeveloperProfile): boolean {
  return Object.values(defaultProfiles).some((candidate) =>
    candidate.name === profile.name &&
    candidate.nationality === profile.nationality &&
    candidate.targetRole === profile.targetRole &&
    candidate.techStack === profile.techStack &&
    candidate.languageLevels === profile.languageLevels &&
    candidate.projectExperience === profile.projectExperience &&
    candidate.selfIntroduction === profile.selfIntroduction &&
    candidate.motivation === profile.motivation &&
    candidate.anxiety === profile.anxiety
  );
}
