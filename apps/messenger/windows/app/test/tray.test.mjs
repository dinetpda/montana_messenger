import test from "node:test";
import assert from "node:assert/strict";
import { restoredAfterFailure, sameTrayOwner } from "../src/tray.js";

test("a successful send puts nothing back", () => {
  assert.deepEqual(restoredAfterFailure({ owner: "A", current: "A", ownerEpoch: 1, currentEpoch: 1, failed: [] }), []);
});

test("a failure in the same chat and visit comes back in its order", () => {
  assert.deepEqual(
    restoredAfterFailure({ owner: "A", current: "A", ownerEpoch: 1, currentEpoch: 1, failed: [2, 0] }),
    [2, 0],
  );
});

test("a late failure after switching to another chat is dropped, never offered to B", () => {
  assert.deepEqual(
    restoredAfterFailure({ owner: "A", current: "B", ownerEpoch: 1, currentEpoch: 1, failed: [0] }),
    [],
  );
});

test("a late failure after reopening the same chat is dropped too (new visit)", () => {
  assert.deepEqual(
    restoredAfterFailure({ owner: "A", current: "A", ownerEpoch: 1, currentEpoch: 2, failed: [0] }),
    [],
  );
});

test("ownership is both the chat and the visit", () => {
  assert.equal(sameTrayOwner("A", "A", 1, 1), true);
  assert.equal(sameTrayOwner("A", "B", 1, 1), false);
  assert.equal(sameTrayOwner("A", "A", 1, 2), false);
});

test("a switch during send does not change the new chat's tray", () => {
  // The old chat's send fails after the person moved to B; B's tray must stay empty.
  let trayB = [];
  const failed = restoredAfterFailure({ owner: "A", current: "B", ownerEpoch: 1, currentEpoch: 1, failed: [0, 1] });
  if (failed.length) trayB = [...failed, ...trayB];
  assert.deepEqual(trayB, []);
});

test("a repeat send restores only its own failure once", () => {
  const first = restoredAfterFailure({ owner: "A", current: "A", ownerEpoch: 1, currentEpoch: 1, failed: [0] });
  const second = restoredAfterFailure({ owner: "A", current: "A", ownerEpoch: 1, currentEpoch: 1, failed: [] });
  assert.deepEqual(first, [0]);
  assert.deepEqual(second, []);
});
