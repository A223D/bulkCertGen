import type { Result } from "../types.ts";
import {
  clampNormalizedRect,
  validateNormalizedRect,
} from "./coordinates.ts";
import type { NormalizedRect } from "./types.ts";

export type PixelRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ResizeHandle = "nw" | "ne" | "sw" | "se";

function error(code: string, message: string): Result<never> {
  return { ok: false, errors: [{ code, message }] };
}

function hasValidContainerDimensions(args: {
  containerWidth: number;
  containerHeight: number;
}): boolean {
  return (
    Number.isFinite(args.containerWidth) &&
    Number.isFinite(args.containerHeight) &&
    args.containerWidth > 0 &&
    args.containerHeight > 0
  );
}

function round(value: number): number {
  return Number(value.toFixed(12));
}

function roundRect(rect: NormalizedRect): NormalizedRect {
  return {
    x: round(rect.x),
    y: round(rect.y),
    width: round(rect.width),
    height: round(rect.height),
  };
}

function assertValidContainerDimensions(args: {
  containerWidth: number;
  containerHeight: number;
}) {
  if (!hasValidContainerDimensions(args)) {
    throw new RangeError("Container dimensions must be positive finite numbers.");
  }
}

export function normalizedRectToPixelRect(args: {
  rect: NormalizedRect;
  containerWidth: number;
  containerHeight: number;
}): PixelRect {
  assertValidContainerDimensions(args);

  return {
    x: args.rect.x * args.containerWidth,
    y: args.rect.y * args.containerHeight,
    width: args.rect.width * args.containerWidth,
    height: args.rect.height * args.containerHeight,
  };
}

export function pixelRectToNormalizedRect(args: {
  rect: PixelRect;
  containerWidth: number;
  containerHeight: number;
}): Result<NormalizedRect> {
  if (!hasValidContainerDimensions(args)) {
    return error(
      "custom_editor_invalid_container",
      "Design preview dimensions are unavailable.",
    );
  }

  const rect: NormalizedRect = {
    x: args.rect.x / args.containerWidth,
    y: args.rect.y / args.containerHeight,
    width: args.rect.width / args.containerWidth,
    height: args.rect.height / args.containerHeight,
  };

  return validateNormalizedRect(rect);
}

export function moveNormalizedRect(args: {
  rect: NormalizedRect;
  deltaX: number;
  deltaY: number;
}): NormalizedRect {
  return roundRect(
    clampNormalizedRect({
      ...args.rect,
      x: args.rect.x + args.deltaX,
      y: args.rect.y + args.deltaY,
    }),
  );
}

export function resizeNormalizedRect(args: {
  rect: NormalizedRect;
  handle: ResizeHandle;
  deltaX: number;
  deltaY: number;
}): NormalizedRect {
  const right = args.rect.x + args.rect.width;
  const bottom = args.rect.y + args.rect.height;
  let nextLeft = args.rect.x;
  let nextTop = args.rect.y;
  let nextRight = right;
  let nextBottom = bottom;

  if (args.handle === "nw" || args.handle === "sw") {
    nextLeft += args.deltaX;
  }

  if (args.handle === "ne" || args.handle === "se") {
    nextRight += args.deltaX;
  }

  if (args.handle === "nw" || args.handle === "ne") {
    nextTop += args.deltaY;
  }

  if (args.handle === "sw" || args.handle === "se") {
    nextBottom += args.deltaY;
  }

  nextLeft = Math.min(Math.max(nextLeft, 0), 1);
  nextTop = Math.min(Math.max(nextTop, 0), 1);
  nextRight = Math.min(Math.max(nextRight, 0), 1);
  nextBottom = Math.min(Math.max(nextBottom, 0), 1);

  return roundRect(
    clampNormalizedRect({
      x: Math.min(nextLeft, nextRight),
      y: Math.min(nextTop, nextBottom),
      width: Math.abs(nextRight - nextLeft),
      height: Math.abs(nextBottom - nextTop),
    }),
  );
}

export function nudgeNormalizedRect(args: {
  rect: NormalizedRect;
  direction: "up" | "down" | "left" | "right";
  amount?: number;
}): NormalizedRect {
  const amount = args.amount ?? 0.005;
  const deltaX =
    args.direction === "left" ? -amount : args.direction === "right" ? amount : 0;
  const deltaY =
    args.direction === "up" ? -amount : args.direction === "down" ? amount : 0;

  return moveNormalizedRect({
    rect: args.rect,
    deltaX,
    deltaY,
  });
}
