import EquAIPlatform from "@/app/_components/EquAIPlatform";
import { DEMO_SCENARIOS } from "@/app/api/_lib/platform";

export default function Page() {
  return <EquAIPlatform scenarios={DEMO_SCENARIOS} />;
}
