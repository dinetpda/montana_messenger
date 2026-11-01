/**
 * TRAY OWNERSHIP (COMPOSE-039, PICK-013): a tray belongs to the conversation it was staged in.
 *
 * A send finishes asynchronously; by then the person may have opened another chat (or left and
 * returned to the same one). Only a completion that still stands in the tray's own conversation
 * and in the same visit of it may put failed files back. Anything else is dropped: a file staged
 * in one chat is never offered to another chat's recipient.
 */

/** Whether a completion still belongs to the tray it started in. */
export function sameTrayOwner(owner, current, ownerEpoch, currentEpoch) {
  return owner === current && ownerEpoch === currentEpoch;
}

/**
 * The files a finished send may put back into the tray: the failed ones, in their order, when the
 * tray is still the same conversation and the same visit; none otherwise.
 */
export function restoredAfterFailure({ owner, current, ownerEpoch, currentEpoch, failed }) {
  if (!failed || !failed.length) return [];
  if (!sameTrayOwner(owner, current, ownerEpoch, currentEpoch)) return [];
  return [...failed];
}
