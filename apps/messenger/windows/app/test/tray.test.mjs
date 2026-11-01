import test from "node:test";
import assert from "node:assert/strict";
import { platesBack, restoresCaption, restoresReply, restoredAfterFailure, sameTrayOwner, withoutPlates } from "../src/tray.js";

const plate = (id, name) => ({ id, file: { name, size: 3 }, kind: "doc" });

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

test("a failed plate comes back as a plate, so a retry sends its file", () => {
  const items = [plate("p1", "one.pdf"), plate("p2", "two.pdf")];
  const back = platesBack(items, [1]);
  assert.equal(back.length, 1);
  assert.equal(back[0].id, "p2");
  assert.equal(back[0].file.size, 3); // not an index: a retry can read .size and send it
});

test("plates staged while a send is finishing stay in the tray", () => {
  const tray = [plate("sent", "a.pdf"), plate("new", "b.pdf")];
  const left = withoutPlates(tray, ["sent"]);
  assert.deepEqual(left.map((p) => p.id), ["new"]);
});

test("a returned first plate brings its caption back only into an empty field", () => {
  const items = [{ id: "p1" }];
  assert.equal(restoresCaption(items, "p1", ""), true);
  assert.equal(restoresCaption(items, "p1", "typed meanwhile"), false);
  assert.equal(restoresCaption([{ id: "p2" }], "p1", ""), false);
});

test("a returned first plate never replaces a reply chosen meanwhile", () => {
  assert.equal(restoresReply([{ id: "p1" }], "p1", null), true);
  assert.equal(restoresReply([{ id: "p1" }], "p1", { mid: "M2" }), false);
});
