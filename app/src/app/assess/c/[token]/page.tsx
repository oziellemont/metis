import type { Metadata } from "next";
import { AssessCandidate } from "@/components/assess/Assess";
export const metadata: Metadata = { referrer: "no-referrer" };
export default async function Page({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; return <AssessCandidate token={token} />; }
