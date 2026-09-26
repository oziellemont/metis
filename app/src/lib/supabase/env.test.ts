import { describe, it, expect } from "vitest";
import { normalizeSupabaseUrl } from "./env";

describe("normalizeSupabaseUrl", () => {
  it("quita /rest/v1/ y barras finales", () => {
    expect(normalizeSupabaseUrl("https://abc.supabase.co/rest/v1/")).toBe("https://abc.supabase.co");
    expect(normalizeSupabaseUrl("https://abc.supabase.co/")).toBe("https://abc.supabase.co");
    expect(normalizeSupabaseUrl("  https://abc.supabase.co/auth/v1 ")).toBe("https://abc.supabase.co");
  });
  it("deja intacto el origen limpio y tolera vacío", () => {
    expect(normalizeSupabaseUrl("https://abc.supabase.co")).toBe("https://abc.supabase.co");
    expect(normalizeSupabaseUrl(undefined)).toBe("");
  });
});
