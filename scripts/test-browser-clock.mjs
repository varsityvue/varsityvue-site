// Loaded only by the disposable browser fixture's app process, never production.
import { readFileSync, existsSync } from "node:fs";
const file = process.env.VARSITYVUE_BROWSER_CLOCK_FILE;
if (!file) throw new Error("Disposable browser clock file is required");
const NativeDate = globalThis.Date;
function now() {
  const value = existsSync(file) ? readFileSync(file, "utf8").trim() : "";
  if (!value) return NativeDate.now();
  const timestamp = NativeDate.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error("Invalid browser fixture time");
  return timestamp;
}
globalThis.Date = new Proxy(NativeDate, {
  construct(target, args, newTarget) {
    return Reflect.construct(target, args.length ? args : [now()], newTarget);
  },
  apply() { return new NativeDate(now()).toString(); },
  get(target, key, receiver) {
    return key === "now" ? now : Reflect.get(target, key, receiver);
  },
});
