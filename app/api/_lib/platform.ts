import {
  DEMO_SCENARIOS as DEFAULT_SCENARIOS,
  type DemoScenario,
} from "@/app/_lib/scenarios";

// EQU AI Platform production base URL.
const PRODUCTION_PLATFORM_URL = "https://api.equ.ai";

const urlOverride = (process.env.EQU_AI_PLATFORM_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

export const PLATFORM_URL = urlOverride || PRODUCTION_PLATFORM_URL;

const isProduction = PLATFORM_URL === PRODUCTION_PLATFORM_URL;

export const PLATFORM_API_KEY_VAR = isProduction
  ? "EQU_AI_PLATFORM_API_KEY"
  : "EQU_AI_PLATFORM_STAGING_API_KEY";

export const PLATFORM_API_KEY = process.env[PLATFORM_API_KEY_VAR] ?? "";

const SCENARIO_OVERRIDES = [
  {
    envVar: "SCENARIO_ID_FREE_CONVERSATION",
    stagingId: "develop/con-school-10min-gemini-1",
  },
  {
    envVar: "SCENARIO_ID_SPEAKING_TEST",
    stagingId: "develop/speaking-test-1",
  },
  {
    envVar: "SCENARIO_ID_CAN_DO_LESSON",
    stagingId: "develop/S1_T1_about-me",
  },
] as const;

export const DEMO_SCENARIOS: readonly DemoScenario[] = DEFAULT_SCENARIOS.map(
  (scenario, index) => {
    const override = SCENARIO_OVERRIDES[index];
    if (!override) return scenario;
    const id =
      process.env[override.envVar]?.trim() ||
      (isProduction ? scenario.id : override.stagingId);
    return id === scenario.id ? scenario : { ...scenario, id };
  },
);

if (!isProduction) {
  console.log(`[platform] staging -> ${PLATFORM_URL}`);
}
