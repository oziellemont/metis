import { describe, it, expect } from "vitest";
import { invitationEmail } from "./email";

describe("invitationEmail", () => {
  it("arma asunto, enlace con token y escapa HTML", () => {
    const m = invitationEmail({ tenantName: "Earth <A>", inviterName: "Oziel Leal", role: "CEO", appUrl: "https://www.metisalign.mx/", token: "abc123", email: "o@x.mx" });
    expect(m.subject).toBe("Oziel Leal te invitó a Earth <A> en METIS");
    expect(m.link).toBe("https://www.metisalign.mx/login?inv=abc123");
    expect(m.html).toContain("Aceptar invitación");
    expect(m.html).not.toContain("Earth <A>");
    expect(m.text).toContain(m.link);
  });
  it("si ya es miembro, manda directo a entrar", () => {
    const m = invitationEmail({ tenantName: "Earth", appUrl: "https://x.mx", token: "t", email: "o@x.mx", alreadyMember: true });
    expect(m.subject).toBe("Te invitaron a Earth en METIS");
    expect(m.link).toBe("https://x.mx/login?next=%2Finicio");
    expect(m.html).toContain("Entrar a METIS");
  });
});
