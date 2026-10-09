"use client";
/** Arma todo lo que se presenta en una sesión a partir de los datos vivos del portal. */
import { useMemo } from "react";
import { useMetis } from "@/lib/store";
import type { Session, Traffic, User } from "@/lib/domain/types";
import { commitmentsOfSession, commitmentsToReview, compliance, previousSession, teamOf, wtmPeriod } from "@/lib/sessions/logic";

export interface PersonKpi { id: string; name: string; scope: string; value: string; target: string; traffic: Traffic; log?: string; weight: number }
export interface PersonSlide {
  user: User;
  attainment: number | null;
  kpis: PersonKpi[];
  reds: number;
}

export function useDeck(session: Session | undefined) {
  const s = useMetis();
  return useMemo(() => {
    if (!session) return null;
    const leader = s.userOf(session.leaderId);
    const isRv = session.kind === "rv";
    // RV: solo el jefe y el colaborador; en el marcador va únicamente el colaborador
    const team = isRv ? [s.userOf(session.participantId)] : teamOf(s.users, session.leaderId);
    const people = [leader, ...team];
    const scored = isRv ? team : people;
    const month = session.kind === "wtm" ? (session.periodMonth ?? wtmPeriod(session.scheduledAt).month) : s.month;
    const today = new Date();

    const slides: PersonSlide[] = scored.map((u) => {
      const sc = s.scorecards.find((x) => x.userId === u.id && x.year === s.year);
      const items = sc ? s.scorecardItems.filter((i) => i.scorecardId === sc.id) : [];
      const kpis = items.map((i): PersonKpi => {
        const ev = s.evaluate(i, month);
        const es = s.esOf(i.elementScopeId);
        const el = s.elementOf(es.elementId);
        const r = s.results.find((x) => x.elementScopeId === i.elementScopeId && x.year === s.year && x.month === month);
        return { id: i.id, name: el.name, scope: s.scopeOf(es.scopeId).name, value: s.fmt(ev.value, el), target: s.fmt(i.targets.sat, el), traffic: ev.traffic, log: r?.log, weight: ev.weight };
      });
      const att = sc ? s.scorecardAttainment(sc.id, month).value : null;
      return { user: u, attainment: att, kpis, reds: kpis.filter((k) => k.traffic === "below").length };
    });

    const review = commitmentsToReview(s.sessions, s.commitments, session);
    const fresh = commitmentsOfSession(s.commitments, session.id);
    const ids = new Set(people.map((p) => p.id));
    // apoyos abiertos que involucran al equipo (los pide o los debe dar alguien del equipo)
    const supports = s.commitments.filter((c) => c.kind === "support" && c.approved && c.status === "open" && c.sessionId !== session.id && (ids.has(c.ownerId) || (c.requestedBy && ids.has(c.requestedBy))));
    const reds = slides.flatMap((p) => p.kpis.filter((k) => k.traffic === "below" || k.traffic === "minimum").map((k) => ({ ...k, user: p.user })));

    let comp;
    if (session.kind === "wtm") {
      const y = session.periodYear ?? wtmPeriod(session.scheduledAt).year;
      comp = compliance(s.commitments, { from: new Date(y, month - 1, 1), to: new Date(y, month, 0), today, ownerIds: [...ids] });
    } else if (isRv) {
      comp = compliance(s.commitments, { from: new Date(today.getTime() - 56 * 86_400_000), to: today, today, ownerIds: team.map((u) => u.id) });
    } else {
      comp = compliance(s.commitments, { from: new Date(today.getTime() - 28 * 86_400_000), to: today, today, ownerIds: [...ids] });
    }
    const pending = slides.reduce((n, p) => n + p.kpis.filter((k) => k.traffic === "pending").length, 0);
    const kpiTotal = slides.reduce((n, p) => n + p.kpis.length, 0);
    const reviewDone = review.filter((c) => c.kind === "commitment" && c.status === "done").length;
    const reviewTotal = review.filter((c) => c.kind === "commitment").length;

    return { leader, team, people, month, slides, review, fresh, supports, reds, compliance: comp, reviewDone, reviewTotal, pending, kpiTotal, previous: previousSession(s.sessions, session) };
  }, [s, session]);
}
