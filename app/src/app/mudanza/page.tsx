import type { Metadata } from "next";
import { Mudanza } from "@/components/site/Mudanza";
export const metadata: Metadata = { title: { absolute: "mêtis CEO · Nos mudamos a metis.ceo" }, robots: { index: false } };
export default function Page() { return <Mudanza />; }
