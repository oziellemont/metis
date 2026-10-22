import { Suspense } from "react";
import { notFound } from "next/navigation";
import { lessonById } from "@/lib/ceo/lessons";
import { LessonPlayer } from "@/components/ceo/CeoAcademy";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = lessonById(id);
  if (!lesson) notFound();
  return <Suspense><LessonPlayer lesson={lesson} /></Suspense>;
}
