import { describe, expect, it } from "vitest";
import { checkOrg, parseCsv, rowsFromTable, toImportPayload } from "./import";

const HEAD = ["Nombre completo", "Correo", "Número de empleado", "Puesto", "Área", "Correo del jefe directo", "Rol"];

describe("rowsFromTable", () => {
  it("reconoce encabezados con variantes y acentos", () => {
    const { rows, error } = rowsFromTable([["NOMBRE", "E-mail", "No. empleado", "Cargo", "Departamento", "Jefe directo", "rol"], ["Ana Pérez", "ANA@x.com ", 101, "Directora", "Dirección", "", "Administrador"]]);
    expect(error).toBeUndefined();
    expect(rows[0]).toMatchObject({ name: "Ana Pérez", email: "ana@x.com", employeeNumber: "101", title: "Directora", area: "Dirección", managerEmail: "", role: "admin", line: 2 });
  });
  it("pide las columnas mínimas", () => {
    expect(rowsFromTable([["Puesto", "Área"], ["x", "y"]]).error).toMatch(/Correo/);
  });
  it("salta filas vacías", () => {
    expect(rowsFromTable([HEAD, [], ["", "", ""], ["Luis", "luis@x.com"]]).rows).toHaveLength(1);
  });
});

describe("checkOrg", () => {
  const table = [HEAD,
    ["Ana", "ana@x.com", "1", "Directora", "Dirección", "", ""],
    ["Beto", "beto@x.com", "2", "Gerente", "Ventas", "ana@x.com", ""],
    ["Caro", "caro@x.com", "3", "Ejecutiva", "Ventas", "beto@x.com", "Colaborador"],
    ["Caro bis", "caro@x.com", "4", "", "", "", ""],
    ["Dani", "dani@x", "5", "", "", "", ""],
  ];
  const { rows } = rowsFromTable(table);
  const res = checkOrg(rows, [{ id: "u1", email: "beto@x.com", name: "Beto" }]);

  it("marca correos repetidos e inválidos", () => {
    expect(res.bad.map((r) => r.line)).toEqual([5, 6]);
  });
  it("infiere Jefe a quien tiene gente a cargo", () => {
    expect(res.ok.find((r) => r.email === "ana@x.com")?.role).toBe("manager");
    expect(res.ok.find((r) => r.email === "caro@x.com")?.role).toBe("collaborator");
  });
  it("arma el árbol con niveles", () => {
    expect(res.tree.map((r) => [r.email, r.depth])).toEqual([["ana@x.com", 0], ["beto@x.com", 1], ["caro@x.com", 2]]);
  });
  it("detecta a quien ya es miembro", () => {
    expect(res.ok.find((r) => r.email === "beto@x.com")?.existing).toBe(true);
  });
  it("detecta ciclos", () => {
    const c = checkOrg(rowsFromTable([HEAD, ["A", "a@x.com", "", "", "", "b@x.com"], ["B", "b@x.com", "", "", "", "a@x.com"]]).rows, []);
    expect(c.bad).toHaveLength(2);
    expect(c.bad[0].errors[0]).toMatch(/Ciclo/);
  });
  it("avisa (sin bloquear) si el jefe no viene en el archivo", () => {
    const c = checkOrg(rowsFromTable([HEAD, ["A", "a@x.com", "", "", "", "jefe@x.com"]]).rows, []);
    expect(c.ok).toHaveLength(1);
    expect(c.ok[0].warnings[0]).toMatch(/quedará ligado/);
  });
  it("arma el payload para la base", () => {
    expect(toImportPayload(res.ok[0])).toMatchObject({ email: "ana@x.com", role: "manager", employee_number: "1", area: "Dirección" });
  });
});

describe("parseCsv", () => {
  it("lee punto y coma y comillas", () => {
    expect(parseCsv('\uFEFFNombre;Correo\n"Pérez, Ana";ana@x.com\r\n')).toEqual([["Nombre", "Correo"], ["Pérez, Ana", "ana@x.com"]]);
  });
});
