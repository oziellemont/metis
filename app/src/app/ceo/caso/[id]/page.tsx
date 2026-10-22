import { notFound } from "next/navigation";
import { ITEMS } from "@/lib/ceo/cases";
import { CaseView } from "@/components/ceo/CaseView";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ITEMS.some((i) => i.id === id)) notFound();
  return <CaseView id={id} />;
}
