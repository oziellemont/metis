"use client";
/**
 * Confirmación para borrar un KPI/proyecto, un «medir aquí» o un alcance.
 * Explica en lenguaje claro qué se va a afectar (scorecards, datos capturados, alcances hijos).
 */
import { useMetis } from "@/lib/store";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deletionImpact, type DeletionTarget } from "@/lib/domain/deletion";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function DeleteCatalogDialog({ target, onClose }: { target: DeletionTarget | null; onClose: () => void }) {
  const s = useMetis();
  if (!target) return null;
  const imp = deletionImpact(s, target);

  let title = ""; let what = "";
  if (target.kind === "element") {
    const el = s.elements.find((e) => e.id === target.id);
    const kind = el?.type === "project" ? "proyecto" : "KPI";
    title = `¿Borrar el ${kind} «${el?.name ?? ""}»?`;
    what = `Se quita del catálogo${imp.elementScopeIds.length ? ` y de los ${plural(imp.elementScopeIds.length, "alcance", "alcances")} donde se mide` : ""}.`;
  } else if (target.kind === "elementScope") {
    const es = s.esOf(target.id);
    title = `¿Dejar de medir «${s.elementOf(es.elementId).name}» en ${s.scopeOf(es.scopeId).name}?`;
    what = "El elemento sigue en el catálogo; sólo deja de medirse en este alcance.";
  } else {
    const sc = s.scopes.find((x) => x.id === target.id);
    title = `¿Borrar el alcance «${sc?.name ?? ""}»?`;
    const parent = imp.newParentId ? s.scopes.find((x) => x.id === imp.newParentId)?.name : null;
    what = imp.childScopes.length
      ? `${plural(imp.childScopes.length, "alcance que cuelga", "alcances que cuelgan")} de él ${imp.childScopes.length === 1 ? "pasa" : "pasan"} a ${parent ? `depender de ${parent}` : "primer nivel"}; no se borran.`
      : "";
    if (imp.elementScopeIds.length) what += `${what ? " " : ""}Se dejan de medir ${plural(imp.elementScopeIds.length, "indicador", "indicadores")} en este alcance.`;
  }

  const people = imp.scorecardUserIds.map((id) => s.userOf(id).name).filter(Boolean);
  const peopleTxt = people.length <= 3 ? people.join(", ") : `${people.slice(0, 3).join(", ")} y ${people.length - 3} más`;

  return (
    <ConfirmDialog
      open
      title={title}
      message={
        <div className="space-y-1.5">
          {what && <p>{what}</p>}
          {imp.items.length > 0 && <p>Sale de {plural(imp.scorecardUserIds.length, "scorecard", "scorecards")}: <span className="text-ink">{peopleTxt}</span>.</p>}
          {imp.results > 0 && <p>Se borran {plural(imp.results, "dato capturado", "datos capturados")}.</p>}
          {imp.commitments > 0 && <p>{plural(imp.commitments, "compromiso ligado se conserva", "compromisos ligados se conservan")}, sin la liga al indicador.</p>}
          {(imp.items.length > 0 || imp.results > 0) && <p className="font-medium text-coral">Esto no se puede deshacer.</p>}
        </div>
      }
      confirmLabel={target.kind === "elementScope" ? "Quitar" : "Borrar"}
      onConfirm={() => { s.removeCatalog(target); onClose(); }}
      onCancel={onClose}
    />
  );
}
