import { SiteNav, SiteFooter } from "@/components/site/SiteNav";
import { IndiceWizard } from "@/components/indice/IndiceWizard";

export const metadata = { title: "Índice de Alineación METIS · gratis en 6 minutos" };

export default function Page() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-4xl px-6 pb-20">
        <IndiceWizard />
      </main>
      <SiteFooter />
    </>
  );
}
