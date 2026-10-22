import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buttonStyle, cardStyle, fieldStyle, textStyle } from "./styles.ts";
import { colors, fonts, radius, size, space } from "./tokens.ts";

describe("Workza tokens", () => {
  it("keeps the web login palette", () => {
    assert.equal(colors.navy, "#0A1F4A");
    assert.equal(colors.teal, "#0BA896");
    assert.equal(colors.ink, "#1A2353");
    assert.equal(colors.background, "#F8FAFC");
    assert.equal(colors.border, "#E2E8F0");
    assert.equal(colors.error, "#EF4444");
    assert.equal(colors.link, "#1867C0");
    assert.equal(colors.success, "#059669");
  });

  it("uses Sora for every type role", () => {
    assert.equal(fonts.regular, "Sora_400Regular");
    assert.equal(textStyle("display").fontFamily, fonts.bold);
    assert.equal(textStyle("title").fontSize, 32);
    assert.equal(textStyle("label").fontWeight, undefined);
    assert.equal(textStyle("label").fontFamily, fonts.bold);
    assert.equal(textStyle("body").fontFamily, fonts.regular);
    assert.equal(textStyle("helper").fontSize, 12);
  });

  it("sizes controls to a 48pt tap target and 8pt input corners", () => {
    assert.equal(size.control, 48);
    assert.equal(radius.control, 8);
    assert.equal(space.md, 16);
    assert.equal(space.xl, 24);
    assert.equal(space.xxl, 32);
  });
});

describe("control styles", () => {
  it("paints a primary button navy and a disabled one at 70%", () => {
    const primary = buttonStyle("primary");
    assert.equal(primary.backgroundColor, colors.navy);
    assert.equal(buttonStyle("primary", { disabled: true }).opacity, 0.7);
    assert.equal(buttonStyle("secondary").borderColor, colors.navy);
    assert.equal(buttonStyle("ghost").backgroundColor, "transparent");
  });

  it("turns a field mint on focus and red on error", () => {
    assert.equal(fieldStyle().borderColor, colors.border);
    assert.equal(fieldStyle({ focused: true }).borderColor, colors.mint);
    assert.equal(fieldStyle({ error: true, focused: true }).borderColor, colors.error);
  });

  it("gives cards the login-sheet radius and paper fill", () => {
    const card = cardStyle();
    assert.equal(card.backgroundColor, colors.card);
    assert.equal(card.borderRadius, radius.sheet);
  });
});
