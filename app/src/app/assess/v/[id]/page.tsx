import { AssessVacancy } from "@/components/assess/Assess";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AssessVacancy id={id} />; }
