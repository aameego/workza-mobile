import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { organisationsForSwitcher } from "./organisations.ts";

describe("organisationsForSwitcher", () => {
  it("hides the switcher when the person belongs to one organisation", () => {
    assert.deepEqual(
      organisationsForSwitcher([{ code: "acme", name: "Acme" }], "ACME"),
      []
    );
  });

  it("lists each organisation once and marks the current one", () => {
    const list = organisationsForSwitcher(
      [
        { code: "acme", name: "Acme" },
        { code: "ACME", name: "Acme duplicate" },
        { code: "beta", name: "Beta" },
      ],
      "BETA"
    );
    assert.deepEqual(list, [
      { code: "BETA", name: "Beta", current: true },
      { code: "ACME", name: "Acme", current: false },
    ]);
  });
});
