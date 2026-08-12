import Dexie, { Table } from "dexie";
import { AppState } from "./types";

interface StateRow { id: string; state: AppState; }
interface MetaRow { id: string; value: any; }

class KaizenDB extends Dexie {
  appstate!: Table<StateRow, string>;
  meta!: Table<MetaRow, string>;
  constructor() {
    super("kaizen");
    this.version(1).stores({ appstate: "id", meta: "id" });
  }
}

export const idb = typeof window !== "undefined" ? new KaizenDB() : (null as any);

export async function loadLocal(): Promise<AppState | null> {
  if (!idb) return null;
  const row = await idb.appstate.get("me");
  return row?.state ?? null;
}
export async function saveLocal(state: AppState) {
  if (!idb) return;
  await idb.appstate.put({ id: "me", state });
}
export async function setMeta(key: string, value: any) {
  if (!idb) return;
  await idb.meta.put({ id: key, value });
}
export async function getMeta(key: string) {
  if (!idb) return null;
  return (await idb.meta.get(key))?.value ?? null;
}
