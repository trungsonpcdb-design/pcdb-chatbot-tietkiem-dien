import { homeSavingsScript } from "./home-savings";
import { officeScript } from "./office";
import { solarScript } from "./solar";
import { pricingScript } from "./pricing";
import { cskhScript } from "./cskh";
import { pickerScript, PICKER_SCRIPT_ID } from "./picker";
import type { ScriptTree } from "./types";

export const SCRIPTS: Record<string, ScriptTree> = {
  [pickerScript.id]: pickerScript,
  [homeSavingsScript.id]: homeSavingsScript,
  [officeScript.id]: officeScript,
  [solarScript.id]: solarScript,
  [pricingScript.id]: pricingScript,
  [cskhScript.id]: cskhScript,
};

export { PICKER_SCRIPT_ID, PICKER_ENTRIES } from "./picker";

export function getScript(id: string): ScriptTree | undefined {
  return SCRIPTS[id];
}

export function resolveInitialScriptId(kbParam: string | undefined): string {
  if (kbParam && SCRIPTS[kbParam] && kbParam !== PICKER_SCRIPT_ID) {
    return kbParam;
  }
  return PICKER_SCRIPT_ID;
}

export * from "./types";
