export interface DraftSectionPlanItem {
  sectionKey: string;
  heading: string;
  position: number;
  objective: string;
  targetWords: number | null;
  researchSummary: string;
  keyPoints: string[];
}

export interface DraftPayload {
  topicId: string;
  styleProfile: string;
  traceId?: string;
  sectionPlan: DraftSectionPlanItem[];
}
