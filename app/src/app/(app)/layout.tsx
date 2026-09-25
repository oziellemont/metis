import { MetisProvider } from "@/lib/store";
import { Shell } from "@/components/app/Shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MetisProvider>
      <Shell>{children}</Shell>
    </MetisProvider>
  );
}
