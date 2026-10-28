import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveAppEnvName } from "./appEnv.ts";

describe("resolveAppEnvName", () => {
  it("treats a missing or unknown name as development, not production", () => {
    assert.equal(resolveAppEnvName(), "development");
    assert.equal(resolveAppEnvName(""), "development");
    assert.equal(resolveAppEnvName("staging"), "development");
  });

  it("keeps local, development, and production when they are set explicitly", () => {
    assert.equal(resolveAppEnvName("local"), "local");
    assert.equal(resolveAppEnvName("development"), "development");
    assert.equal(resolveAppEnvName("production"), "production");
  });
});

describe("checked-in env files", () => {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const assignedEnv = (fileName: string) =>
    fs
      .readFileSync(path.join(root, fileName), "utf8")
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line && !line.startsWith("#") && line.startsWith("EXPO_PUBLIC_API_ENV="));

  it("keeps debug and release env files on development so expo run and QA APKs open dev.workza.ai", () => {
    assert.equal(assignedEnv(".env"), "EXPO_PUBLIC_API_ENV=development");
    assert.equal(assignedEnv(".env.production"), "EXPO_PUBLIC_API_ENV=development");
  });
});
