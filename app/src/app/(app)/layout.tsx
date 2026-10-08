import { MetisProvider } from "@/lib/store";
import { Shell } from "@/components/app/Shell";
import { AcademyProvider } from "@/components/academy/AcademyProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MetisProvider>
      <AcademyProvider>
        <Shell>{children}</Shell>
      </AcademyProvider>
    </MetisProvider>
  );
}
