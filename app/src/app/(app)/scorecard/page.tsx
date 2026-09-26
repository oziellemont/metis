"use client";
import { useMetis } from "@/lib/store";
import { ScorecardView } from "@/components/app/ScorecardView";

export default function Page() {
  const s = useMetis();
  return <ScorecardView userId={s.currentUserId} />;
}
