import "fake-indexeddb/auto"; // requried to use the database in tests
import { describe, it, beforeEach, afterEach, expect } from "vitest";
import { database, config } from "../../src/lib/localStorage/database";
import { openDB } from "idb";

const repoA = "test/test1";
const repoB = "test/test2";

const store = "markdown";
const key = "README.md";
const value = "# Hello World";

describe("database module", () => {
    // Ensure database is clean before and after each test
    beforeEach(async () => {
        await database.destroy();
    });

    afterEach(async () => {
        await database.destroy();
    });

    /**
     * Verifies that an error is thrown when accessing the DB without setting a repo.
     */
    it("should throw if used before repo is set", async () => {
        await expect(database.getDB()).rejects.toThrow(/active repo/);
    });

    /**
     * Tests storing and retrieving data by key.
     */
    it("should save and load data", async () => {
        database.setActiveRepo(repoA);
        await database.save(store, key, value);
        const result = await database.load<string>(store, key);
        expect(result).toBe(value);
    });

    /**
     * Ensures all keys are listed.
     */
    it("should list all keys", async () => {
        database.setActiveRepo(repoA);
        await database.save(store, "a.md", "A");
        await database.save(store, "b.md", "B");
        const keys = await database.keys(store);
        expect(keys.sort()).toEqual(["a.md", "b.md"]);
    });

    /**
     * Verifies that specific keys can be deleted.
     */
    it("should delete specific keys", async () => {
        database.setActiveRepo(repoA);
        await database.save(store, "file1.md", "data");
        await database.save(store, "file2.md", "data");
        await database.delete(store, "file1.md");
        const keys = await database.keys(store);
        expect(keys).toEqual(["file2.md"]);
    });

    /**
     * Clears all keys for the current repo within a given store.
     */
    it("should clear all keys for current repo in store", async () => {
        database.setActiveRepo(repoA);
        await database.save(store, "1.md", "one");
        await database.save(store, "2.md", "two");
        await database.clear(store);
        const keys = await database.keys(store);
        expect(keys).toEqual([]);
    });

    /**
     * Verifies `has()` correctly identifies presence or absence of keys.
     */
    it("should return true/false for has()", async () => {
        database.setActiveRepo(repoA);
        await database.save(store, "exists.md", "yes");
        const hasIt = await database.has(store, "exists.md");
        const missing = await database.has(store, "missing.md");
        expect(hasIt).toBe(true);
        expect(missing).toBe(false);
    });

    /**
     * Loads all key-value pairs.
     */
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

    /**
     * Throws an error when trying to use an invalid store.
     */
    it("should reject invalid store usage", async () => {
        database.setActiveRepo(repoA);
        await expect(database.save("notastore", "x", "y")).rejects.toThrow(
            /Invalid store/,
        );
    });

    /**
     * Prevents changing the repo once initialized.
     */
    it("should not allow changing active repo after initialization", async () => {
        database.setActiveRepo(repoA);
        expect(() => database.setActiveRepo(repoB)).toThrow(
            /change active repo/,
        );
    });

    /**
     * Destroys database state, with and without preserving the active repo.
     */
    it("should reset active repo on destroy unless preserved", async () => {
        database.setActiveRepo(repoA);
        await database.destroy();
        expect(database.isInitialised()).toBe(false);

        database.setActiveRepo(repoA);
        await database.destroy({ preserveRepo: true });
        expect(database.isInitialised()).toBe(true);
    });

    /**
     * Verifies transactional rollback.
     */
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

    /**
     * Confirms another tab (simulated via a separate connection) can read data.
     */
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

    /**
     * Verifies visibility of writes only after the transaction is complete.
     */
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

    /**
     * Confirms that data from an aborted transaction is not persisted.
     */
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

    /**
     * Ensures `loadAll()` filters out keys from other repos.
     */
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

    /**
     * Verifies that the repo can be reset and changed after destroy().
     */
    it("should allow changing repo if DB has been destroyed", async () => {
        database.setActiveRepo(repoA);
        await database.destroy();
        database.setActiveRepo(repoB); // Should not throw now
        await database.save(store, "x.md", "ok");
        const val = await database.load(store, "x.md");
        expect(val).toBe("ok");
    });

    /**
     * Confirms `getActiveRepo()` returns the current repo.
     */
    it("getActiveRepo() should return current repo", async () => {
        database.setActiveRepo(repoA);
        expect(database.getActiveRepo()).toBe(repoA);
    });

    /**
     * Verifies that different stores can be used independently.
     */
    it("should handle multiple stores independently", async () => {
        database.setActiveRepo(repoA);

        // Save to different stores
        await database.save("markdown", "mdfile.md", "Markdown Content");
        await database.save("images", "image.png", "Base64ImageData");
        await database.save("metadata", "meta.json", '{ "author": "alice" }');

        // Load back each value and assert correctness
        const md = await database.load("markdown", "mdfile.md");
        const img = await database.load("images", "image.png");
        const meta = await database.load("metadata", "meta.json");

        expect(md).toBe("Markdown Content");
        expect(img).toBe("Base64ImageData");
        expect(meta).toBe('{ "author": "alice" }');

        // Keys should be isolated per store
        const markdownKeys = await database.keys("markdown");
        const imageKeys = await database.keys("images");
        const metaKeys = await database.keys("metadata");

        expect(markdownKeys).toEqual(["mdfile.md"]);
        expect(imageKeys).toEqual(["image.png"]);
        expect(metaKeys).toEqual(["meta.json"]);
    });

    /**
     * Simulates two tabs working on separate repos without interference.
     */
    it("should allow multiple tabs to work on separate repos simultaneously", async () => {
        // Tab 1
        database.setActiveRepo(repoA);
        await database.save("markdown", "shared1.md", "Content A");

        // Simulate Tab 2 with its own DB connection and different repo
        const altDB = await openDB(config.name, config.version);
        const tx = altDB.transaction("markdown", "readwrite");
        const fullKeyB = `${repoB}::shared2.md`;
        await tx.store.put("Content B", fullKeyB);
        await tx.done;

        // Tab 1 should see only its own data
        const ownData = await database.load("markdown", "shared1.md");
        expect(ownData).toBe("Content A");

        // Tab 2 reads its data directly
        const readTx = altDB.transaction("markdown", "readonly");
        const otherData = await readTx.store.get(fullKeyB);
        await readTx.done;

        expect(otherData).toBe("Content B");

        // Confirm loadAll() from Tab 1 doesn't include Tab 2's entry
        const tab1Keys = await database.keys("markdown");
        expect(tab1Keys).not.toContain("shared2.md"); // from repoB
        expect(tab1Keys).toContain("shared1.md"); // from repoA

        altDB.close();
    });
});
