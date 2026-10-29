import { EpisodeView } from "@/components/ceo/EpisodeView";
export const metadata = { title: "Caso ejecutivo" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EpisodeView id={id} />;
}
