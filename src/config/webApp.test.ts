import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  decideOpenWindow,
  decideWebViewNavigation,
  isExternalMapsUrl,
  isMapsAssetUrl,
  isWebAppSignedOutUrl,
  parseMapsCoordinates,
  reconstructHttpsFromIntent,
  resolveWebAppBaseUrl,
  sessionBootstrapScript,
  shouldAllowWebViewRequest,
  toNativeMapsUrl,
  urlForExternalOpen,
  webAppEntryUrl,
} from "./webApp.ts";

const session = {
  token: "jwt-token",
  user: {
    id: "user-1",
    name: "Asha",
    role: "Admin",
    vendorName: "Acme Corp",
    vendor_code: "ACME",
    allowedModules: ["dashboard"],
    photoUrl: "https://cdn.example/a.png",
  },
  organisations: [{ code: "ACME", name: "Acme Corp" }],
};

describe("resolveWebAppBaseUrl", () => {
  it("maps development and production to the Workza sites", () => {
    assert.equal(resolveWebAppBaseUrl({ envName: "development" }), "https://dev.workza.ai");
    assert.equal(resolveWebAppBaseUrl({ envName: "production" }), "https://workza.ai");
    assert.equal(resolveWebAppBaseUrl({ envName: "local" }), "http://localhost:3000");
  });

  it("lets an explicit URL win and strips a trailing slash", () => {
    assert.equal(
      resolveWebAppBaseUrl({
        explicitUrl: "https://dev.workza.ai/",
        envName: "production",
      }),
      "https://dev.workza.ai"
    );
  });
});

describe("webAppEntryUrl", () => {
  it("opens the vendor dashboard the web app uses after login", () => {
    assert.equal(
      webAppEntryUrl(session, { envName: "development" }),
      "https://dev.workza.ai/acme-corp/dashboard"
    );
  });

  it("hyphenates names like Pvt. Ltd. the same way the web app does", () => {
    assert.equal(
      webAppEntryUrl(
        {
          ...session,
          user: {
            ...session.user,
            vendorName: "Genexit Facility Management Solutions Pvt. Ltd.",
          },
        },
        { envName: "production" }
      ),
      "https://workza.ai/genexit-facility-management-solutions-pvt-ltd/dashboard"
    );
  });
});

describe("sessionBootstrapScript", () => {
  it("writes token, user, and organisations into localStorage", () => {
    const script = sessionBootstrapScript(session);
    assert.match(script, /localStorage\.setItem\('token', "jwt-token"\)/);
    assert.match(script, /localStorage\.setItem\('user',/);
    assert.match(script, /Acme Corp/);
    assert.match(script, /photoUrl/);
    assert.match(script, /localStorage\.setItem\('organisations',/);
  });
});

describe("isWebAppSignedOutUrl", () => {
  const base = "https://dev.workza.ai";

  it("treats the web login routes as signed out", () => {
    assert.equal(isWebAppSignedOutUrl("https://dev.workza.ai/login", base), true);
    assert.equal(isWebAppSignedOutUrl("https://dev.workza.ai/create-org", base), true);
    assert.equal(isWebAppSignedOutUrl("https://dev.workza.ai/forgot-password", base), true);
  });

  it("keeps HRMS modules inside the webview", () => {
    assert.equal(isWebAppSignedOutUrl("https://dev.workza.ai/acme-corp/dashboard", base), false);
    assert.equal(isWebAppSignedOutUrl("https://dev.workza.ai/acme-corp/attendance", base), false);
    assert.equal(isWebAppSignedOutUrl("https://dev.workza.ai/acme-corp/letters", base), false);
    assert.equal(isWebAppSignedOutUrl("https://dev.workza.ai/acme-corp/payroll", base), false);
  });
});

describe("shouldAllowWebViewRequest", () => {
  const base = "https://dev.workza.ai";

  it("never cancels blank, blob, or data URLs", () => {
    assert.equal(shouldAllowWebViewRequest({ url: "about:blank" }, base), true);
    assert.equal(shouldAllowWebViewRequest({ url: "blob:https://dev.workza.ai/abc" }, base), true);
    assert.equal(shouldAllowWebViewRequest({ url: "data:text/html,hi" }, base), true);
  });

  it("allows in-app HRMS routes including a login URL that already committed", () => {
    assert.equal(
      shouldAllowWebViewRequest({ url: "https://dev.workza.ai/acme-corp/attendance" }, base),
      true
    );
    assert.equal(shouldAllowWebViewRequest({ url: "https://dev.workza.ai/login" }, base), true);
  });

  it("allows Maps iframes and Android requests that omit isTopFrame", () => {
    assert.equal(
      shouldAllowWebViewRequest(
        { url: "https://maps.googleapis.com/maps/api/js", isTopFrame: false },
        base
      ),
      true
    );
    assert.equal(
      shouldAllowWebViewRequest({ url: "https://maps.googleapis.com/maps/api/js" }, base),
      true
    );
    assert.equal(
      shouldAllowWebViewRequest(
        { url: "https://maps.googleapis.com/maps/api/js", isTopFrame: true },
        base
      ),
      true
    );
    assert.equal(isMapsAssetUrl("https://khms0.googleapis.com/kh"), true);
  });

  it("opens attendance pin links in the system Maps app instead of swallowing target=_blank", () => {
    const pin = "https://www.google.com/maps?q=28.46,77.02";
    assert.equal(isExternalMapsUrl(pin), true);
    assert.deepEqual(decideWebViewNavigation({ url: pin, isTopFrame: true }, base), {
      action: "openExternal",
      url: pin,
    });
    assert.deepEqual(decideWebViewNavigation({ url: pin }, base), {
      action: "openExternal",
      url: pin,
    });
    assert.deepEqual(decideOpenWindow(pin, base), { action: "openExternal", url: pin });
    assert.equal(
      shouldAllowWebViewRequest({ url: pin, isTopFrame: false }, base),
      true
    );
    assert.equal(toNativeMapsUrl(pin, "android"), "geo:28.46,77.02?q=28.46,77.02");
    assert.equal(toNativeMapsUrl(pin, "ios"), "maps:?q=28.46,77.02");
    assert.equal(urlForExternalOpen(pin, "android"), "geo:28.46,77.02?q=28.46,77.02");
  });

  it("turns Google Maps Open App intents into a geo link the Maps app can open", () => {
    const intent =
      "intent://www.google.com/maps?q=28.6139,77.209#Intent;scheme=https;package=com.google.android.apps.maps;end";
    assert.equal(isExternalMapsUrl(intent), true);
    assert.equal(shouldAllowWebViewRequest({ url: intent }, base), false);
    assert.deepEqual(decideWebViewNavigation({ url: intent }, base), {
      action: "openExternal",
      url: intent,
    });
    assert.equal(
      reconstructHttpsFromIntent(intent),
      "https://www.google.com/maps?q=28.6139,77.209"
    );
    assert.deepEqual(parseMapsCoordinates(intent), { lat: "28.6139", lng: "77.209" });
    assert.equal(urlForExternalOpen(intent, "android"), "geo:28.6139,77.209?q=28.6139,77.209");
  });

  it("blocks only an explicit top-frame jump off the Workza site", () => {
    assert.equal(
      shouldAllowWebViewRequest({ url: "https://example.com/leave", isTopFrame: true }, base),
      false
    );
  });
});
