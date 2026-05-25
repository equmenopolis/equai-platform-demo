export interface DemoScenario {
  id: string;
  label: string;
  description: string;
  producesResults: boolean;
}

export const DEMO_SCENARIOS: readonly DemoScenario[] = [
  {
    id: "conversation-school-10min-6",
    label: "Free conversation",
    description: "An open, unscored practice conversation with InteLLA.",
    producesResults: false,
  },
  {
    id: "speaking-test-2",
    label: "Speaking test",
    description:
      "Measures the ability to maintain a spontaneous conversation, scored on the seven-point CEFR scale.",
    producesResults: true,
  },
  {
    id: "HS1_my-house1",
    label: "Can-Do lesson",
    description:
      "Returns a Can-Do checklist of “I can…” statements showing which competencies the learner demonstrated.",
    producesResults: true,
  },
] as const;
