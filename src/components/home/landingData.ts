export type LandingAudience = "developer" | "employer";
export type BridgeDirectionId = "kr-jp" | "jp-kr";

export const landingAudiences: Array<{
  id: LandingAudience;
  label: string;
  eyebrow: string;
  destination: string;
}> = [
  {
    id: "developer",
    label: "Developer",
    eyebrow: "Find companies",
    destination: "/developer"
  },
  {
    id: "employer",
    label: "Employer",
    eyebrow: "Find applicants",
    destination: "/employer"
  }
];

export const bridgeDirections: Record<
  BridgeDirectionId,
  {
    id: BridgeDirectionId;
    shortLabel: string;
    source: string;
    target: string;
    title: string;
    description: string;
  }
> = {
  "kr-jp": {
    id: "kr-jp",
    shortLabel: "KR -> JP",
    source: "South Korea",
    target: "Japan",
    title: "Seoul -> Tokyo",
    description:
      "Cross into the Japanese IT market with stronger evidence around high-context communication, team consensus, and technical clarity."
  },
  "jp-kr": {
    id: "jp-kr",
    shortLabel: "JP -> KR",
    source: "Japan",
    target: "South Korea",
    title: "Tokyo -> Seoul",
    description:
      "Enter the Korean startup market with clearer signals around speed, ownership, and cross-cultural technical leadership."
  }
};
