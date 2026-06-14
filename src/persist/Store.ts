// Store: IndexedDB persistence for the world. Meta (seed, player, inventory,
// time, furnaces) lives under one key; each player-modified chunk is stored as
// its raw block array. Terrain is regenerated from the seed on load, then these
// chunk diffs are overlaid, so only edited chunks need saving.
const DB_NAME = "blockcraft";
const STORE = "kv";
const VERSION = 1;
const CHUNK_PREFIX = "c:";
const META_KEY = "meta";

export interface ItemSave {
  item: number;
  count: number;
}

export interface FurnaceSave {
  key: string;
  input: ItemSave | null;
  fuel: ItemSave | null;
  output: ItemSave | null;
  burn: number;
  burnMax: number;
  cook: number;
}

export interface SaveMeta {
  version: number;
  seed: number;
  time: number; // sky time-of-day
  player: {
    x: number; y: number; z: number; yaw: number; pitch: number;
    health: number; air: number; hunger: number;
  };
  inventory: (ItemSave | null)[];
  furnaces: FurnaceSave[];
}

export class Store {
  private readonly dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async store(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.dbPromise;
    return db.transaction(STORE, mode).objectStore(STORE);
  }

  private static done(req: IDBRequest): Promise<void> {
    return new Promise((res, rej) => {
      req.onsuccess = () => res();
      req.onerror = () => rej(req.error);
    });
  }

  async getMeta(): Promise<SaveMeta | null> {
    const s = await this.store("readonly");
    const req = s.get(META_KEY);
    await Store.done(req);
    return (req.result as SaveMeta) ?? null;
  }

  async putMeta(meta: SaveMeta): Promise<void> {
    const s = await this.store("readwrite");
    await Store.done(s.put(meta, META_KEY));
  }

  /** Write player-modified chunks (block arrays are copied so the live data is safe). */
  async putChunks(entries: { cx: number; cz: number; data: Uint8Array }[]): Promise<void> {
    if (entries.length === 0) return;
    const s = await this.store("readwrite");
    for (const e of entries) s.put(e.data.slice(), CHUNK_PREFIX + e.cx + "," + e.cz);
    await new Promise<void>((res, rej) => {
      s.transaction.oncomplete = () => res();
      s.transaction.onerror = () => rej(s.transaction.error);
    });
  }

  /** All saved chunk diffs, keyed "cx,cz". */
  async getAllChunks(): Promise<Map<string, Uint8Array>> {
    const s = await this.store("readonly");
    const out = new Map<string, Uint8Array>();
    return new Promise((resolve, reject) => {
      const req = s.openCursor();
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return resolve(out);
        const key = String(cursor.key);
        if (key.startsWith(CHUNK_PREFIX)) out.set(key.slice(CHUNK_PREFIX.length), cursor.value as Uint8Array);
        cursor.continue();
      };
    });
  }

  async hasSave(): Promise<boolean> {
    return (await this.getMeta()) !== null;
  }

  async clearAll(): Promise<void> {
    const s = await this.store("readwrite");
    await Store.done(s.clear());
  }
}
