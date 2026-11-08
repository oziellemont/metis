import { redirect } from "next/navigation";
// La StartUp se elige al empezar; ya no se abre una empresa paralela desde Mi empresa.
export default function Page() { redirect("/ceo/empresa"); }
