import type { Metadata } from "next";
import { CeoAuth } from "@/components/ceo/auth/CeoAuth";
export const metadata: Metadata = { title: { absolute: "Entrar · MÊTIS CEO" }, robots: { index: false } };
export default function Page() { return <CeoAuth />; }
