import LegacyTask from "./LegacyTask";
import ResearchExperience from "./research/ResearchExperience";
import { publicDataset } from "@/lib/research/materials";
export const metadata = { title: "Everyday Judgments & Forecasts · Human–AI Research" };
export default async function TaskPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  if (query.legacy === "1") return <LegacyTask />;
  return <ResearchExperience initialDataset={publicDataset(query.debug === "1" || !query.study)} researcher={query.debug === "1"} studyId={typeof query.study === "string" ? query.study : null} mode={query.mode === "user_set" ? "user_set" : "fixed"} />;
}
