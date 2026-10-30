import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MOBILE_APP_VERSION,
  MOBILE_APP_VERSION_HEADER,
  MOBILE_CLIENT_KEY_HEADER,
  mobileClientRequestHeaders,
} from "./mobileClient.ts";

describe("mobileClientRequestHeaders", () => {
  it("always sends the app version so the backend can reject older APKs", () => {
    const headers = mobileClientRequestHeaders();
    assert.equal(headers[MOBILE_APP_VERSION_HEADER], MOBILE_APP_VERSION);
    assert.match(headers["User-Agent"] || "", /WorkzaMobile\/1\.0\.5/);
  });

  it("includes the client key only when EXPO_PUBLIC_MOBILE_CLIENT_KEY is set", () => {
    const previous = process.env.EXPO_PUBLIC_MOBILE_CLIENT_KEY;
    delete process.env.EXPO_PUBLIC_MOBILE_CLIENT_KEY;
    assert.equal(mobileClientRequestHeaders()[MOBILE_CLIENT_KEY_HEADER], undefined);

    process.env.EXPO_PUBLIC_MOBILE_CLIENT_KEY = "next-build-secret";
    assert.equal(mobileClientRequestHeaders()[MOBILE_CLIENT_KEY_HEADER], "next-build-secret");

    if (previous === undefined) delete process.env.EXPO_PUBLIC_MOBILE_CLIENT_KEY;
    else process.env.EXPO_PUBLIC_MOBILE_CLIENT_KEY = previous;
  });
});
