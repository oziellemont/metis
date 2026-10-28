import type { Metadata } from "next";
import { CeoNewPassword } from "@/components/ceo/auth/CeoAuth";
export const metadata: Metadata = { title: { absolute: "Contraseña nueva · MÊTIS CEO" }, robots: { index: false } };
export default function Page() { return <CeoNewPassword />; }
