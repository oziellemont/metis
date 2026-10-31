import { Suspense } from "react";
import { ReportView } from "@/components/ceo/ReportView";
export const metadata = { title: "Reporte del mes" };
export default function Page() { return <Suspense><ReportView /></Suspense>; }
