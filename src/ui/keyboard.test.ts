import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { KEYBOARD_SCROLL_PROPS, keyboardAvoidingBehavior } from "./keyboard.ts";

describe("keyboard avoiding", () => {
  it("lifts the scroll view with the keyboard on both platforms", () => {
    assert.equal(KEYBOARD_SCROLL_PROPS.automaticallyAdjustKeyboardInsets, true);
    assert.equal(KEYBOARD_SCROLL_PROPS.keyboardShouldPersistTaps, "handled");
    assert.equal(keyboardAvoidingBehavior("ios"), "padding");
    assert.equal(keyboardAvoidingBehavior("android"), "padding");
  });
});
