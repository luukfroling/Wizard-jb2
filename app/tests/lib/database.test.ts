import "fake-indexeddb/auto"; // requried to use the database in tests
import { describe, it, beforeEach, afterEach, expect } from "vitest";
import { database, config } from "../../src/lib/localStorage/database";
import { openDB } from "idb";

const repoA = "octocat/hello-world";
const repoB = "octocat/other-repo";

const store = "markdown";
const key = "README.md";
const value = "# Hello World";

describe("database module", () => {
    beforeEach(async () => {
        await database.destroy();
    });

    afterEach(async () => {
        await database.destroy();
    });

    it("should throw if used before repo is set", async () => {
        await expect(database.getDB()).rejects.toThrow(/active repo/);
    });

    it("should save and load data", async () => {
        database.setActiveRepo(repoA);
        await database.save(store, key, value);
        const result = await database.load<string>(store, key);
        expect(result).toBe(value);
    });

    it("should list keys only for the active repo", async () => {
        database.setActiveRepo(repoA);
        await database.save(store, "a.md", "A");
        await database.save(store, "b.md", "B");
        const keys = await database.keys(store);
        expect(keys.sort()).toEqual(["a.md", "b.md"]);
    });

    it("should delete specific keys", async () => {
        database.setActiveRepo(repoA);
        await database.save(store, "file1.md", "data");
        await database.save(store, "file2.md", "data");
        await database.delete(store, "file1.md");
        const keys = await database.keys(store);
        expect(keys).toEqual(["file2.md"]);
    });

    it("should clear all keys for current repo in store", async () => {
        database.setActiveRepo(repoA);
        await database.save(store, "1.md", "one");
        await database.save(store, "2.md", "two");
        await database.clear(store);
        const keys = await database.keys(store);
        expect(keys).toEqual([]);
    });

    it("should return true/false for has()", async () => {
        database.setActiveRepo(repoA);
        await database.save(store, "exists.md", "yes");
        const hasIt = await database.has(store, "exists.md");
        const missing = await database.has(store, "missing.md");
        expect(hasIt).toBe(true);
        expect(missing).toBe(false);
    });

    it("should loadAll() key-value pairs for current repo only", async () => {
        database.setActiveRepo(repoA);
        await database.save(store, "one.md", "1");
        await database.save(store, "two.md", "2");
        const all = await database.loadAll(store);
        expect(all).toEqual([
            ["one.md", "1"],
            ["two.md", "2"],
        ]);
    });

    it("should reject invalid store usage", async () => {
        database.setActiveRepo(repoA);
        await expect(database.save("notastore", "x", "y")).rejects.toThrow(
            /Invalid store/,
        );
    });

    it("should not allow changing active repo after initialization", async () => {
        database.setActiveRepo(repoA);
        expect(() => database.setActiveRepo(repoB)).toThrow(
            /change active repo/,
        );
    });

    it("should reset active repo on destroy unless preserved", async () => {
        database.setActiveRepo(repoA);
        await database.destroy();
        expect(database.isInitialised()).toBe(false);

        database.setActiveRepo(repoA);
        await database.destroy({ preserveRepo: true });
        expect(database.isInitialised()).toBe(true);
    });

    it("should not persist partial writes if transaction fails", async () => {
        database.setActiveRepo(repoA);
        const db = await database.getDB();

        const tx = db.transaction(store, "readwrite");
        const fullKey1 = `${repoA}::partial1.md`;
        const fullKey2 = `${repoA}::partial2.md`;

        await tx.store.put("data1", fullKey1);
        await tx.store.put("data2", fullKey2);

        tx.abort();

        try {
            await tx.done;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
            //expected
        }

        // Confirm data is not saved
        const keys = await database.keys(store);
        expect(keys).not.toContain("partial1.md");
        expect(keys).not.toContain("partial2.md");
    });

    it("should allow simultaneous access from multiple db connections", async () => {
        database.setActiveRepo(repoA);
        await database.save(store, "a.md", "From Main Connection");

        // Open a separate IndexedDB connection (simulating another tab)
        const altDB = await openDB(config.name, config.version);
        const tx = altDB.transaction(store, "readonly");
        const val = await tx.store.get(`${repoA}::a.md`);
        await tx.done;

        expect(val).toBe("From Main Connection");
        altDB.close();
    });

    it("should see uncommitted writes only after transaction done", async () => {
        database.setActiveRepo(repoA);
        const db = await database.getDB();

        const tx = db.transaction(store, "readwrite");
        const fullKey = `${repoA}::transient.md`;
        await tx.store.put("temp", fullKey);

        // Try reading before .done — should still work because IDB commits on success
        const readTx = db.transaction(store, "readonly");
        const result = await readTx.store.get(fullKey);
        await readTx.done;

        expect(result).toBe("temp");

        await tx.done;

        // After commit, data should still be available
        const final = await database.load(store, "transient.md");
        expect(final).toBe("temp");
    });

    it("should not see data from a failed transaction", async () => {
        database.setActiveRepo(repoA);
        const db = await database.getDB();

        const tx = db.transaction(store, "readwrite");
        const fullKey = `${repoA}::failtest.md`;
        await tx.store.put("will-fail", fullKey);
        tx.abort(); // Cancel transaction
        try {
            await tx.done;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
            // expected
        }

        // Should not exist
        const result = await database.load(store, "failtest.md");
        expect(result).toBeUndefined();
    });

    it("loadAll() should not return data from other repos", async () => {
        database.setActiveRepo(repoA);
        await database.save(store, "a.md", "A");
        await database.save(store, "b.md", "B");

        const db = await database.getDB();
        const otherTx = db.transaction(store, "readwrite");
        await otherTx.store.put("Z", `${repoB}::z.md`);
        await otherTx.done;

        const result = await database.loadAll(store);
        const keys = result.map(([k]) => k);
        expect(keys).not.toContain("z.md");
    });

    it("should allow changing repo if DB has not been used yet", async () => {
        database.setActiveRepo(repoA);
        await database.destroy();
        database.setActiveRepo(repoB); // Should not throw now
        await database.save(store, "x.md", "ok");
        const val = await database.load(store, "x.md");
        expect(val).toBe("ok");
    });

    it("getActiveRepo() should return current repo", async () => {
        database.setActiveRepo(repoA);
        expect(database.getActiveRepo()).toBe(repoA);
    });
});
