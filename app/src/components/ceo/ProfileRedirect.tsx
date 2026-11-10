"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { careerHrefOfProfileHash } from "./career-tabs";

/** Perfil ya vive dentro de Carrera: la dirección anterior manda a la vista Mi perfil, conservando el ancla. */
export function ProfileRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace(careerHrefOfProfileHash(window.location.hash)); }, [router]);
  return null;
}
