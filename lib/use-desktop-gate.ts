"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DESKTOP_MIN_WIDTH,
  LARGE_TABLET_MAX_WIDTH,
  readForceDesktop,
  resolveGateStatus,
  writeForceDesktop,
  type GateStatus,
} from "./desktop-gate";

const WIDTH_QUERY = `(min-width: ${DESKTOP_MIN_WIDTH}px)`;
const COARSE_QUERY = `(pointer: coarse) and (max-width: ${LARGE_TABLET_MAX_WIDTH - 1}px)`;

// Same-tab sessionStorage writes fire no `storage` event, so allowAnyway()
// notifies subscribers manually through this module-level set.
const overrideListeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  const widthQuery = window.matchMedia(WIDTH_QUERY);
  const coarseQuery = window.matchMedia(COARSE_QUERY);
  widthQuery.addEventListener("change", onStoreChange);
  coarseQuery.addEventListener("change", onStoreChange);
  overrideListeners.add(onStoreChange);
  return () => {
    widthQuery.removeEventListener("change", onStoreChange);
    coarseQuery.removeEventListener("change", onStoreChange);
    overrideListeners.delete(onStoreChange);
  };
}

// A stable primitive snapshot: identical state -> identical string, so
// useSyncExternalStore never loops. The server snapshot maps to "pending"
// so the first paint reserves space instead of guessing the viewport.
function getSnapshot(): string {
  return [
    window.matchMedia(WIDTH_QUERY).matches,
    window.matchMedia(COARSE_QUERY).matches,
    readForceDesktop(),
  ].join("|");
}

function getServerSnapshot(): string {
  return "pending";
}

function snapshotToStatus(snapshot: string): GateStatus {
  if (snapshot === "pending") return "pending";
  const [meetsWidth, isCoarseSmall, overridden] = snapshot
    .split("|")
    .map((value) => value === "true");
  return resolveGateStatus({ mounted: true, meetsWidth, isCoarseSmall, overridden });
}

export function useDesktopGate(): { status: GateStatus; allowAnyway: () => void } {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const allowAnyway = useCallback(() => {
    writeForceDesktop();
    for (const listener of overrideListeners) listener();
  }, []);

  return { status: snapshotToStatus(snapshot), allowAnyway };
}
