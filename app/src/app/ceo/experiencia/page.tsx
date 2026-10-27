import { Suspense } from "react";
import { Experience } from "@/components/ceo/Experience";
export const metadata = { title: "Tu experiencia" };
export default function Page() { return <Suspense><Experience /></Suspense>; }
