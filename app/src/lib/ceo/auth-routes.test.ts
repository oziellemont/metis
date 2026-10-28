import { describe, expect, it } from "vitest";
import { ceoAuthMessage, ceoDefaultMode, ceoGate, ceoLoginHref, ceoLoginRequired, ceoSafeNext, isCeoDestination, isCeoPrivatePath, isValidEmail, passwordProblem } from "./auth-routes";

describe("acceso a mêtis CEO", () => {
  it("todo /ceo exige sesión; la landing, /entrar y /legal no", () => {
    for (const p of ["/ceo", "/ceo/bandeja", "/ceo/caso/x", "/ceo/empezar", "/ceo/ajustes"]) {
      expect(isCeoPrivatePath(p)).toBe(true);
      expect(ceoGate(p, false)).toBe("login");
      expect(ceoGate(p, true)).toBe("allow");
    }
    for (const p of ["/", "/simulador", "/entrar", "/legal/privacidad", "/ceox", "/login", "/inicio"]) expect(ceoGate(p, false)).toBe("allow");
  });

  it("quien ya entró no vuelve a ver /entrar, salvo la pantalla de contraseña nueva", () => {
    expect(ceoGate("/entrar", true)).toBe("leave_login");
    expect(ceoGate("/entrar/nueva-clave", true)).toBe("allow");
  });

  it("solo regresa a rutas internas seguras", () => {
    expect(ceoSafeNext("/ceo/bandeja")).toBe("/ceo/bandeja");
    expect(ceoSafeNext("/bandeja?x=1")).toBe("/bandeja?x=1");
    for (const bad of ["https://malo.com", "//malo.com", "/\\malo.com", "javascript:alert(1)", "", null, undefined, "/entrar", "/entrar?next=/ceo", "/ce\no"]) expect(ceoSafeNext(bad)).toBe("/ceo");
    expect(ceoSafeNext("//x", "/ceo/empezar")).toBe("/ceo/empezar");
  });

  it("arma la URL de entrada conservando a dónde se quería ir", () => {
    expect(ceoLoginHref("/ceo")).toBe("/entrar");
    expect(ceoLoginHref(null)).toBe("/entrar");
    expect(ceoLoginHref("//malo.com")).toBe("/entrar");
    expect(ceoLoginHref("/bandeja")).toBe("/entrar?next=%2Fbandeja");
  });

  it("quien viene de «Empezar» ve primero «Crear cuenta»", () => {
    expect(ceoDefaultMode("/ceo/empezar", null)).toBe("crear");
    expect(ceoDefaultMode("/empezar", null)).toBe("crear");
    expect(ceoDefaultMode("/ceo/bandeja", null)).toBe("entrar");
    expect(ceoDefaultMode(null, "crear")).toBe("crear");
    expect(ceoDefaultMode("/ceo/empezar", "entrar")).toBe("entrar");
  });

  it("los errores del callback de CEO regresan a /entrar", () => {
    expect(isCeoDestination("/ceo/empezar")).toBe(true);
    expect(isCeoDestination("/entrar/nueva-clave")).toBe(true);
    expect(isCeoDestination("/unirme")).toBe(false);
  });

  it("interruptor de emergencia: solo CEO_REQUIRE_LOGIN=0 lo apaga", () => {
    expect(ceoLoginRequired(undefined)).toBe(true);
    expect(ceoLoginRequired("1")).toBe(true);
    expect(ceoLoginRequired(" 0 ")).toBe(false);
  });
});

describe("validación de la cuenta", () => {
  it("correo", () => {
    expect(isValidEmail("ana@empresa.mx")).toBe(true);
    expect(isValidEmail(" ana@empresa.mx ")).toBe(true);
    for (const e of ["", "ana", "ana@", "ana@x", "a b@x.com"]) expect(isValidEmail(e)).toBe(false);
  });
  it("contraseña: 8 o más, con letras y números", () => {
    expect(passwordProblem("corta1")).toMatch(/8/);
    expect(passwordProblem("soloLetrasLargas")).toMatch(/letras y números/);
    expect(passwordProblem("12345678")).toMatch(/letras y números/);
    expect(passwordProblem("Monterrey2026")).toBeNull();
    expect(passwordProblem("año2026ñ")).toBeNull();
  });
  it("mensajes claros y sin revelar si un correo existe", () => {
    expect(ceoAuthMessage("Invalid login credentials")).toBe("El correo o la contraseña no coinciden.");
    expect(ceoAuthMessage("Email not confirmed")).toMatch(/confirmar/);
    expect(ceoAuthMessage("Unsupported provider: provider is not enabled")).toMatch(/Google/);
    expect(ceoAuthMessage("Email rate limit exceeded")).toMatch(/minuto/);
    expect(ceoAuthMessage("cualquier cosa rara")).toBe("Algo salió mal. Intenta de nuevo.");
    expect(ceoAuthMessage("")).toBe("Algo salió mal. Intenta de nuevo.");
  });
});
