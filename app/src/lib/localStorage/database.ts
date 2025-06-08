import { openDB, IDBPDatabase } from "idb";

export const config = {
    name: "test_database",
    version: 1,
    stores: ["metadata", "markdown", "images"], //...
};

const _makePrefixedKey = (repo: string, key: IDBValidKey): IDBValidKey => {
    return `${repo}::${key}`;
};

const _stripPrefix = (repo: string, fullKey: IDBValidKey): IDBValidKey => {
    if (typeof fullKey === "string" && fullKey.startsWith(`${repo}::`)) {
        return fullKey.slice(repo.length + 2); // +2 for '::'
    }
    return fullKey;
};

const _validateStore = (store: string): void => {
    if (!config.stores.includes(store)) {
        throw new Error(
            `Invalid store "${store}". Must be one of: ${config.stores.join(", ")}`,
        );
    }
};

export const database = {
    dbPromise: null as Promise<IDBPDatabase> | null,
    activeRepo: "" as string,

    getActiveRepo(): string {
        return this.activeRepo;
    },

    setActiveRepo(repo: string) {
        if (this.isInitialised()) {
            throw new Error(
                "Attempting to change active repo after repo was already set. This is not supported!",
            );
        }
        this.activeRepo = repo;
    },

    isInitialised() {
        return this.activeRepo != "";
    },

    async getDB(): Promise<IDBPDatabase> {
        if (!this.isInitialised()) {
            throw new Error(
                "Attempting to access database before setting the active repo. Make sure the repo is set before any database interactions take place!",
            );
        }
        if (!this.dbPromise) {
            this.dbPromise = openDB(config.name, config.version, {
                upgrade(db) {
                    for (const store of config.stores) {
                        if (!db.objectStoreNames.contains(store)) {
                            db.createObjectStore(store);
                        }
                    }
                },
            });
        }
        return this.dbPromise;
    },

    async save<T>(store: string, key: IDBValidKey, value: T): Promise<void> {
        _validateStore(store);
        const db = await this.getDB();
        const tx = db.transaction(store, "readwrite");
        const fullKey = _makePrefixedKey(this.activeRepo, key);
        await tx.store.put(value, fullKey);
        await tx.done;
    },

    async load<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
        _validateStore(store);
        const db = await this.getDB();
        const tx = db.transaction(store, "readonly");
        const fullKey = _makePrefixedKey(this.activeRepo, key);
        const result = await tx.store.get(fullKey);
        await tx.done;
        return result;
    },

    async loadAll<T>(store: string): Promise<[IDBValidKey, T][]> {
        _validateStore(store);
        const db = await this.getDB();
        const tx = db.transaction(store, "readonly");
        const allKeys = await tx.store.getAllKeys();
        const results: [IDBValidKey, T][] = [];

        for (const key of allKeys) {
            if (
                typeof key === "string" &&
                key.startsWith(`${this.activeRepo}::`)
            ) {
                const strippedKey = _stripPrefix(this.activeRepo, key);
                const value = await tx.store.get(key);
                if (value !== undefined) {
                    results.push([strippedKey, value]);
                }
            }
        }

        await tx.done;
        return results;
    },

    async delete(store: string, key: IDBValidKey): Promise<void> {
        _validateStore(store);
        const db = await this.getDB();
        const tx = db.transaction(store, "readwrite");
        const fullKey = _makePrefixedKey(this.activeRepo, key);
        await tx.store.delete(fullKey);
        await tx.done;
    },

    async keys(store: string): Promise<IDBValidKey[]> {
        _validateStore(store);
        const db = await this.getDB();
        const tx = db.transaction(store, "readonly");
        const allKeys = await tx.store.getAllKeys();
        await tx.done;
        return allKeys
            .filter(
                (k) =>
                    typeof k === "string" &&
                    k.startsWith(`${this.activeRepo}::`),
            )
            .map((k) => _stripPrefix(this.activeRepo, k));
    },

    async clear(store: string): Promise<void> {
        _validateStore(store);
        const db = await this.getDB();
        const tx = db.transaction(store, "readwrite");
        const allKeys = await tx.store.getAllKeys();
        for (const key of allKeys) {
            if (
                typeof key === "string" &&
                key.startsWith(`${this.activeRepo}::`)
            ) {
                await tx.store.delete(key);
            }
        }
        await tx.done;
    },

    async has(store: string, key: IDBValidKey): Promise<boolean> {
        _validateStore(store);
        const db = await this.getDB();
        const tx = db.transaction(store, "readonly");
        const fullKey = _makePrefixedKey(this.activeRepo, key);
        const exists = (await tx.store.getKey(fullKey)) !== undefined;
        await tx.done;
        return exists;
    },

    async destroy({ preserveRepo = false } = {}): Promise<void> {
        if (this.dbPromise) {
            (await this.dbPromise).close();
            this.dbPromise = null;
        }
        if (!preserveRepo) this.activeRepo = "";
        await indexedDB.deleteDatabase(config.name);
    },
};
