import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── CLARIFY response shape ─────────────────────────────────────────────
export interface Question {
  id: number;
  question: string;
  options: string[];
  multiSelect: boolean;
  maxSelections: number;
  allowOther: boolean;
  required: boolean;
}

export type TaskType =
  | 'Trigger' | 'Data Fetch' | 'Research' | 'Analysis'
  | 'Content Generation' | 'Decision' | 'Data Transform' | 'Output';

export type ExecutionApproach =
  | 'Direct LLM Usage' | 'LLM Skill / Prompt Template'
  | 'Scheduled Automation' | 'Full Autonomous Agent';

export type FreemiumVerdict =
  | 'Freemium sufficient' | 'Freemium to start upgrade likely' | 'Paid required';

export interface BlueprintTask {
  number: number; name: string; type: TaskType;
  llm: string; llmReason: string; platform: string;
  description: string; isUxSuggestion?: boolean;
}

export interface LLMDistribution { llm: string; taskCount: number; taskNames: string[]; }

export interface ToolGap { tool: string; reason: string; workaround: string; }
export interface PrivacyConflict { tool: string; issue: string; workaround: string; }
export interface ToolAnalysis {
  toolsRequired: string[]; toolsUserHas: string[]; toolsBlocked: string[];
  toolsGap: ToolGap[]; toolsPrivacyConflict: PrivacyConflict[];
}

export interface ROIAlternative { name: string; description: string; cost: string; bestFor: string; }
export interface ROIAssessment { worthIt: boolean; summary: string; alternatives: ROIAlternative[]; }

export interface DetailedStep {
  taskNumber: number; taskName: string; description: string;
  platform: string; llm: string; promptTemplate: string;
  input: string; output: string; connection: string;
  setupTime: string; isUxSuggestion?: boolean;
}

export interface BlueprintResult {
  title: string; executionApproach: ExecutionApproach;
  executionRationale: string; tasks: BlueprintTask[];
  visualFlow: string; llmDistribution: LLMDistribution[];
  platformRecommendation: string; platformRationale: string;
  llmRationale: string; freemiumVerdict: FreemiumVerdict;
  primaryLLM: string; billingNote: string;
  cliffWarning: string | null; toolAnalysis: ToolAnalysis;
  roiAssessment: ROIAssessment; detailedSteps: DetailedStep[];
  // Verification Layer
  confidenceScore?: number;
  confidenceRationale?: string;
  estimatedTimeSaved?: string;
  platformSources?: { pricing: string; freeTier?: string; docs?: string; };
  llmSources?: { pricing: string; capabilities: string; };
}

export interface IntakeState {
  userType: string; field: string; orgType: string; dept: string;
  company: string; role: string; useCase: string;
  usageIntent: string; execPref: string;
}

const DEFAULT_INTAKE: IntakeState = {
  userType: '', field: '', orgType: '', dept: '', company: '',
  role: '', useCase: '', usageIntent: '', execPref: '',
};

interface BlueprintStore {
  intake: IntakeState; questions: Question[];
  answers: Record<number, string | string[]>;
  result: BlueprintResult | null; shareId: string | null;
  setIntake: (key: keyof IntakeState, value: string) => void;
  setQuestions: (qs: Question[]) => void;
  setAnswers: (a: Record<number, string | string[]>) => void;
  setResult: (r: BlueprintResult) => void;
  setShareId: (id: string) => void;
  reset: () => void;
}

export const useBlueprintStore = create<BlueprintStore>()(
  persist(
    (set) => ({
      intake: DEFAULT_INTAKE, questions: [], answers: {},
      result: null, shareId: null,
      setIntake: (key, value) => set((s) => ({ intake: { ...s.intake, [key]: value } })),
      setQuestions: (qs) => set({ questions: qs }),
      setAnswers: (a) => set({ answers: a }),
      setResult: (r) => set({ result: r }),
      setShareId: (id) => set({ shareId: id }),
      reset: () => set({ intake: DEFAULT_INTAKE, questions: [], answers: {}, result: null, shareId: null }),
    }),
    {
      name: 'blueprint_v1',
      partialize: (s) => ({ intake: s.intake, questions: s.questions, answers: s.answers, result: s.result, shareId: s.shareId }),
    }
  )
);
