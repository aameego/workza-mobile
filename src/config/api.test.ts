import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveApiBaseUrl } from "./api.ts";

describe("resolveApiBaseUrl", () => {
  it("uses an explicit URL and forces the /api suffix", () => {
    assert.equal(
      resolveApiBaseUrl({ explicitUrl: "https://dev-gig.aameego.com/" }),
      "https://dev-gig.aameego.com/api"
    );
  });

  it("keeps a URL that already ends in /api", () => {
    assert.equal(
      resolveApiBaseUrl({ explicitUrl: "http://192.168.1.8:5001/api" }),
      "http://192.168.1.8:5001/api"
    );
  });

  it("maps local, development, and production names to the existing backends", () => {
    assert.equal(resolveApiBaseUrl({ envName: "local" }), "http://localhost:5001/api");
    assert.equal(
      resolveApiBaseUrl({ envName: "development" }),
      "https://dev-gig.aameego.com/api"
    );
    assert.equal(
      resolveApiBaseUrl({ envName: "production" }),
      "https://backend-gig.aameego.com/api"
    );
  });

  it("lets an explicit URL win over the environment name", () => {
    assert.equal(
      resolveApiBaseUrl({
        explicitUrl: "http://10.0.2.2:5001",
        envName: "production",
      }),
      "http://10.0.2.2:5001/api"
    );
  });

  it("falls back to development when the environment is missing or unknown so QA never silently hits production", () => {
    assert.equal(resolveApiBaseUrl({}), "https://dev-gig.aameego.com/api");
    assert.equal(
      resolveApiBaseUrl({ envName: "staging" }),
      "https://dev-gig.aameego.com/api"
    );
  });
});
