export interface DemoScenario {
  id: string;
  label: string;
  description: string;
  producesResults: boolean;
}

export const DEMO_SCENARIOS: readonly DemoScenario[] = [
  {
    id: "develop/con-school-10min-gemini-1",
    label: "Free conversation",
    description: "An open, unscored practice conversation with InteLLA.",
    producesResults: false,
  },
  {
    id: "develop/speaking-test-1",
    label: "Speaking test",
    description:
      "Measures the ability to maintain a spontaneous conversation, scored on the seven-point CEFR scale.",
    producesResults: true,
  },
  {
    id: "develop/S1_T1_about-me",
    label: "Can-Do lesson",
    description:
      "Returns a Can-Do checklist of “I can…” statements showing which competencies the learner demonstrated.",
    producesResults: true,
  },
] as const;
