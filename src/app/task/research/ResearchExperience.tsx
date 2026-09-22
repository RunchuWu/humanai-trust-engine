"use client";
import type { PublicDataset } from "@/lib/research/types";
import ResearcherWorkspace from "./ResearcherWorkspace";
import ParticipantExperience from "./ParticipantExperience";
export default function ResearchExperience({ initialDataset, researcher, studyId, mode }: { initialDataset: PublicDataset; researcher: boolean; studyId: string | null; mode: "fixed" | "user_set" }) {
  return researcher ? <ResearcherWorkspace dataset={initialDataset} /> : <ParticipantExperience initialDataset={initialDataset} studyId={studyId} mode={mode} />;
}
