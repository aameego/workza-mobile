import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createSessionController, type KeyValueStore } from "./sessionStore.ts";

const session = {
  token: "jwt",
  user: {
    id: "user-1",
    name: "Asha",
    role: "Employee",
    vendorName: "Acme",
    vendor_code: "ACME",
  },
  organisations: [{ code: "ACME", name: "Acme" }],
};

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    async getItem(key) {
      return data.has(key) ? data.get(key)! : null;
    },
    async setItem(key, value) {
      data.set(key, value);
    },
    async deleteItem(key) {
      data.delete(key);
    },
  };
}

describe("session controller", () => {
  it("keeps a remembered session across a cold start", async () => {
    const store = memoryStore();
    const first = createSessionController(store);
    await first.persist(session, true);

    const second = createSessionController(store);
    assert.equal(second.token(), null);
    const restored = await second.hydrate();
    assert.deepEqual(restored, session);
    assert.equal(second.token(), "jwt");
  });

  it("drops an unremembered session when the app is opened again", async () => {
    const store = memoryStore();
    const first = createSessionController(store);
    await first.persist(session, false);
    assert.equal(first.token(), "jwt");
    assert.equal(store.data.size, 0);

    const second = createSessionController(store);
    assert.equal(await second.hydrate(), null);
  });

  it("clears memory and the secure store on logout", async () => {
    const store = memoryStore();
    const controller = createSessionController(store);
    await controller.persist(session, true);
    await controller.clear();
    assert.equal(controller.token(), null);
    assert.equal(store.data.size, 0);
    assert.equal(await controller.hydrate(), null);
  });
});
