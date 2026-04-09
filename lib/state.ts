import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Question shape (from CLARIFY prompt response) ──────────────────────
export interface Question {
  id: number;
  text: string;
  type: 'single' | 'multi' | 'text';
  options?: string[];
}

// ── Task / Step shapes (from SYSPROMPT JSON schema) ───────────────────
export interface BlueprintTask {
  id: number;
  type: string;        // Trigger | Data Fetch | Research | Analysis | Content Generation | Decision | Data Transform | Output
  name: string;
  tool: string;
  llm?: string;
  llmReason?: string;  // Punchy 1-sentence reason per Golden Rules
  isUxSuggestion?: boolean;
  details?: string;
}

export interface BlueprintStep {
  id: number;
  title: string;
  tool: string;
  prompt?: string;
  isUxSuggestion?: boolean;
  details?: string;
}

export interface CostPerLLM {
  name: string;
  taskCount: number;
  singleINR: number;
  monthlyINR: number;
}

export interface BlueprintROI {
  timeSavedPerRun: string;
  runsPerMonth: number;
  totalTimeSavedPerMonth: string;
  monetaryValue?: string;
}

export interface ToolGap {
  needed: string;
  reason: string;
}

// Full result shape returned by SYSPROMPT
export interface BlueprintResult {
  platform: string;
  llms: string[];
  estimatedTimeSaved: string;
  tasks: BlueprintTask[];
  steps: BlueprintStep[];
  roi: BlueprintROI;
  toolGaps?: ToolGap[];
  costMeta?: {
    freqFromUser: boolean;
    runsPerMonth: number;
    perLLM: CostPerLLM[];
  };
  // Post-migration feature (Verification Layer — not yet active)
  confidenceScore?: number;
  confidenceRationale?: string;
}

// ── Intake fields ──────────────────────────────────────────────────────
export interface IntakeState {
  userType: string;
  field: string;       // field of study (Student)
  orgType: string;     // org size (Working Professional / CXO)
  dept: string;        // department
  company: string;
  role: string;
  useCase: string;
  usageIntent: string;
  execPref: string;    // "One-time task" | "Repeatable workflow"
  uxOptimize: boolean;
}

const DEFAULT_INTAKE: IntakeState = {
  userType: '',
  field: '',
  orgType: '',
  dept: '',
  company: '',
  role: '',
  useCase: '',
  usageIntent: '',
  execPref: '',
  uxOptimize: false,
};

// ── Store interface ────────────────────────────────────────────────────
interface BlueprintStore {
  // Cross-page state (persisted to localStorage)
  intake: IntakeState;
  questions: Question[];
  answers: Record<number, string | string[]>;
  result: BlueprintResult | null;
  shareId: string | null;

  // Actions
  setIntake: (key: keyof IntakeState, value: IntakeState[keyof IntakeState]) => void;
  setQuestions: (qs: Question[]) => void;
  setAnswers: (a: Record<number, string | string[]>) => void;
  setResult: (r: BlueprintResult) => void;
  setShareId: (id: string) => void;
  reset: () => void;
}

// ── Store creation ─────────────────────────────────────────────────────
export const useBlueprintStore = create<BlueprintStore>()(
  persist(
    (set) => ({
      intake: DEFAULT_INTAKE,
      questions: [],
      answers: {},
      result: null,
      shareId: null,

      setIntake: (key, value) =>
        set((state) => ({ intake: { ...state.intake, [key]: value } })),

      setQuestions: (qs) => set({ questions: qs }),

      setAnswers: (a) => set({ answers: a }),

      setResult: (r) => set({ result: r }),

      setShareId: (id) => set({ shareId: id }),

      reset: () =>
        set({
          intake: DEFAULT_INTAKE,
          questions: [],
          answers: {},
          result: null,
          shareId: null,
        }),
    }),
    {
      name: 'blueprint-store',
      // Only persist cross-page data — not transient UI state
      partialize: (state) => ({
        intake: state.intake,
        questions: state.questions,
        answers: state.answers,
        result: state.result,
        shareId: state.shareId,
      }),
    }
  )
);
