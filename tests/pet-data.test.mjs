import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, beforeEach, test } from "node:test";
import { fetchAnimals } from "../utils/animals.mjs";

// Next compiles the app's ESM .js files; Node can load this standalone module
// directly through a data URL without changing the project's package type.
const source = await readFile(new URL("../app/fetchOrderedPets/fetchOrderedPets.js", import.meta.url));
const { fetchOrderedPets } = await import(`data:text/javascript;base64,${source.toString("base64")}`);
const originalFetch = globalThis.fetch;
const originalStorage = globalThis.localStorage;
const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const pet = { id: 1, name: "Archer", "dog/cat": "dog", images: [], tags: {} };

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-public-key";
  globalThis.localStorage = { getItem: () => null };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.localStorage = originalStorage;
  for (const [key, value] of [
    ["NEXT_PUBLIC_SUPABASE_URL", originalUrl],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", originalKey],
  ]) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("database reads bypass caches and see pets added after an empty result", async () => {
  let animals = [];
  let requests = 0;
  globalThis.fetch = async (input, options) => {
    const url = new URL(input);
    assert.equal(url.pathname, "/rest/v1/Available%20Animals");
    assert.equal(url.searchParams.get("select"), "*");
    assert.equal(options.cache, "no-store");
    requests++;
    return Response.json(animals);
  };
  assert.deepEqual(await fetchAnimals(), []);
  animals = [pet];
  assert.deepEqual(await fetchAnimals(), [pet]);
  animals = [];
  assert.deepEqual(await fetchAnimals(), []);
  assert.equal(requests, 3);
});

test("database permission errors are not treated as an empty listing", async () => {
  globalThis.fetch = async () => Response.json({ message: "permission denied", code: "42501" }, { status: 403 });
  await assert.rejects(fetchAnimals(), error => error.code === "42501");
});

test("missing database configuration produces an explicit error", async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  await assert.rejects(fetchAnimals(), /Missing Supabase/);
});

test("visitors without preferences load the uncached unranked endpoint", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/animals");
    assert.equal(options.cache, "no-store");
    return Response.json([pet]);
  };
  assert.deepEqual(await fetchOrderedPets(), [pet]);
});

test("saved preferences load ranked animals", async () => {
  const preferences = { "Pet Preference": ["Dogs"] };
  globalThis.localStorage = { getItem: () => JSON.stringify(preferences) };
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/animalsByPreference");
    assert.equal(options.method, "POST");
    assert.equal(options.cache, "no-store");
    assert.deepEqual(JSON.parse(options.body), preferences);
    return Response.json([pet]);
  };
  assert.deepEqual(await fetchOrderedPets(), [pet]);
});

test("corrupt or inaccessible preferences do not prevent loading pets", async () => {
  globalThis.fetch = async (url) => {
    assert.equal(url, "/api/animals");
    return Response.json([pet]);
  };
  for (const value of ["invalid JSON", "[]", "42", "null"]) {
    globalThis.localStorage = { getItem: () => value };
    assert.deepEqual(await fetchOrderedPets(), [pet]);
  }
  globalThis.localStorage = { getItem: () => { throw new Error("Storage blocked"); } };
  assert.deepEqual(await fetchOrderedPets(), [pet]);
});

test("ranking failure falls back to the unranked endpoint", async (t) => {
  t.mock.method(console, "error", () => {});
  globalThis.localStorage = { getItem: () => "{}" };
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(url);
    return url === "/api/animalsByPreference"
      ? Response.json({ error: "Failed to fetch animals" }, { status: 500 })
      : Response.json([pet]);
  };
  assert.deepEqual(await fetchOrderedPets(), [pet]);
  assert.deepEqual(calls, ["/api/animalsByPreference", "/api/animals"]);
});

test("unranked errors and invalid responses reach the UI error handler", async () => {
  globalThis.fetch = async () => Response.json({ error: "Failed to fetch data" }, { status: 500 });
  await assert.rejects(fetchOrderedPets(), /Failed to load pets \(500\)/);
  globalThis.fetch = async () => Response.json({ error: "Unexpected response" });
  await assert.rejects(fetchOrderedPets(), /Invalid pet data/);
});
