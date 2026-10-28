import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { WEBVIEW_SHELL_PROPS } from "./webViewShell.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const home = readFileSync(join(root, "src/app/home.tsx"), "utf8");

describe("WEBVIEW_SHELL_PROPS", () => {
  it("does not enable nested scrolling on the full-screen WebView", () => {
    assert.equal(WEBVIEW_SHELL_PROPS.nestedScrollEnabled, false);
  });

  it("is what HomeScreen passes through, not a one-off nestedScrollEnabled prop", () => {
    assert.match(home, /WEBVIEW_SHELL_PROPS/);
    assert.doesNotMatch(home, /^\s*nestedScrollEnabled\s*$/m);
  });
});
