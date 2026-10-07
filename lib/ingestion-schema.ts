/** Small dependency-free validators for versioned intake, not a persistence schema. */
export type Schema<T> = { check: (value: unknown, path: string, errors: string[]) => boolean; readonly output?: T };
export type Infer<S> = S extends Schema<infer T> ? T : never;
export const rule = <T>(label: string, predicate: (value: unknown) => boolean): Schema<T> => ({
  check(value, path, errors) { if (predicate(value)) return true; errors.push(`${path}: expected ${label}.`); return false; },
});
export const text = rule<string>("non-empty text", v => typeof v === "string" && Boolean(v.trim()));
export const slug = rule<string>("school slug", v => typeof v === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v));
export const integer = rule<number>("non-negative safe integer", v => typeof v === "number" && Number.isSafeInteger(v) && v >= 0);
export const season = rule<number>("four-digit season from 2000", v => typeof v === "number" && Number.isInteger(v) && v >= 2000 && v <= 9999);
export const literal = <const T extends string | number>(v: T) => rule<T>(JSON.stringify(v), x => x === v);
export const enumeration = <const T extends readonly string[]>(values: T) => rule<T[number]>(values.join(" | "), v => typeof v === "string" && values.includes(v));
export function array<S extends Schema<unknown>>(item: S): Schema<Infer<S>[]> {
  return { check(v, p, e) { if (!Array.isArray(v)) { e.push(`${p}: expected array.`); return false; } return Array.from(v, (x, i) => item.check(x, `${p}[${i}]`, e)).every(Boolean); } };
}
export function object<const S extends Record<string, Schema<unknown>>>(fields: S): Schema<{ -readonly [K in keyof S]: Infer<S[K]> }> {
  return { check(v, p, e) {
    if (typeof v !== "object" || v === null || Array.isArray(v) || ![Object.prototype, null].includes(Object.getPrototypeOf(v))) { e.push(`${p}: expected plain object.`); return false; }
    const r = v as Record<string, unknown>;
    const before = e.length;
    for (const k of Object.keys(r)) if (!Object.hasOwn(fields, k)) e.push(`${p}.${k}: unsupported field.`);
    for (const [k, s] of Object.entries(fields)) s.check(r[k], `${p}.${k}`, e);
    return e.length === before;
  } };
}
export function union<const S extends readonly Schema<unknown>[]>(...variants: S): Schema<Infer<S[number]>> {
  return { check(v, p, e) {
    const alternatives = variants.map(s => { const errors: string[] = []; const ok = s.check(v, p, errors); return { ok, errors }; });
    if (alternatives.some(x => x.ok)) return true;
    e.push(...alternatives.sort((a, b) => a.errors.length - b.errors.length)[0].errors); return false;
  } };
}
export function parse<S extends Schema<unknown>>(schema: S, value: unknown): { ok: true; value: Infer<S> } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  return schema.check(value, "draft", errors) ? { ok: true, value: value as Infer<S> } : { ok: false, errors };
}
