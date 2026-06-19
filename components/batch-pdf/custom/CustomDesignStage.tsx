"use client";

/* eslint-disable @next/next/no-img-element -- Local object URLs cannot be optimized by next/image. */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Rnd, type HandleStyles, type ResizeEnable } from "react-rnd";
import { CUSTOM_DESIGN_LIMITS } from "@/lib/batch-pdf/limits";
import {
  normalizedRectToPixelRect,
  nudgeNormalizedRect,
} from "@/lib/batch-pdf/custom/editor-geometry";
import { clampNormalizedRect } from "@/lib/batch-pdf/custom/coordinates";
import type {
  CustomFieldBox,
  DesignAsset,
  NormalizedRect,
} from "@/lib/batch-pdf/custom/types";

type CustomDesignStageProps = {
  file: File | null;
  asset: DesignAsset;
  previewUrl: string | null;
  boxes: CustomFieldBox[];
  selectedBoxId: string | null;
  onSelectBox: (boxId: string | null) => void;
  onUpdateBoxRect: (boxId: string, rect: NormalizedRect) => void;
};

type StageSize = {
  width: number;
  height: number;
};

const resizeDirections: ResizeEnable = {
  top: true,
  right: true,
  bottom: true,
  left: true,
  topRight: true,
  bottomRight: true,
  bottomLeft: true,
  topLeft: true,
};

const handleBase = {
  backgroundColor: "var(--color-panel)",
  border: "2px solid var(--color-accent)",
  borderRadius: 4,
  boxShadow: "0 1px 4px rgba(26, 25, 22, 0.28)",
  zIndex: 30,
} satisfies React.CSSProperties;

const resizeHandleStyles: HandleStyles = {
  topLeft: { ...handleBase, width: 14, height: 14, top: -7, left: -7 },
  topRight: { ...handleBase, width: 14, height: 14, top: -7, right: -7 },
  bottomRight: { ...handleBase, width: 14, height: 14, right: -7, bottom: -7 },
  bottomLeft: { ...handleBase, width: 14, height: 14, bottom: -7, left: -7 },
  top: {
    ...handleBase,
    width: 18,
    height: 10,
    top: -6,
    left: "50%",
    marginLeft: -9,
  },
  right: {
    ...handleBase,
    width: 10,
    height: 18,
    right: -6,
    top: "50%",
    marginTop: -9,
  },
  bottom: {
    ...handleBase,
    width: 18,
    height: 10,
    bottom: -6,
    left: "50%",
    marginLeft: -9,
  },
  left: {
    ...handleBase,
    width: 10,
    height: 18,
    left: -6,
    top: "50%",
    marginTop: -9,
  },
};

function boxLabel(box: CustomFieldBox): string {
  if (box.label.trim()) {
    return box.label;
  }

  return box.source.type === "csvColumn" ? box.source.column : "Static text";
}

function cssFontFamily(fontFamily: CustomFieldBox["style"]["fontFamily"]): string {
  if (fontFamily === "Times") return "Times New Roman, serif";
  if (fontFamily === "Courier") return "Courier New, monospace";
  return "Arial, Helvetica, sans-serif";
}

function horizontalPosition(align: CustomFieldBox["style"]["align"]): string {
  if (align === "center") return "center";
  if (align === "right") return "flex-end";
  return "flex-start";
}

function verticalPosition(align: CustomFieldBox["style"]["verticalAlign"]): string {
  if (align === "middle") return "center";
  if (align === "bottom") return "flex-end";
  return "flex-start";
}

function roundNormalized(value: number): number {
  return Number(value.toFixed(12));
}

export function CustomDesignStage({
  file,
  asset,
  previewUrl: _previewUrl,
  boxes,
  selectedBoxId,
  onSelectBox,
  onUpdateBoxRect,
}: CustomDesignStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState<StageSize>({ width: 0, height: 0 });
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const aspectRatio = asset.intrinsicWidth / asset.intrinsicHeight;
  const stageWidthByViewportHeight = `min(100%, max(320px, calc(${(aspectRatio * 100).toFixed(3)}vh - ${(aspectRatio * 15.5).toFixed(3)}rem)))`;

  // Create a local object URL from the file so the preview survives parent
  // component remounts that revoke the originally-created URL.
  useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImgUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateSize = () => {
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      setStageSize((current) =>
        current.width === rect.width && current.height === rect.height
          ? current
          : { width: rect.width, height: rect.height },
      );
    };

    if (typeof ResizeObserver === "undefined") {
      const frame = window.requestAnimationFrame(updateSize);
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [aspectRatio]);

  function commitPixelRect(
    boxId: string,
    xPx: number,
    yPx: number,
    widthPx: number,
    heightPx: number,
  ) {
    if (stageSize.width <= 0 || stageSize.height <= 0) return;

    const rect = clampNormalizedRect({
      x: xPx / stageSize.width,
      y: yPx / stageSize.height,
      width: widthPx / stageSize.width,
      height: heightPx / stageSize.height,
    });

    onUpdateBoxRect(boxId, {
      x: roundNormalized(rect.x),
      y: roundNormalized(rect.y),
      width: roundNormalized(rect.width),
      height: roundNormalized(rect.height),
    });
  }

  function handleKeyDown(
    box: CustomFieldBox,
    event: React.KeyboardEvent<HTMLDivElement>,
  ) {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const direction = event.key.replace("Arrow", "").toLowerCase() as
      | "up"
      | "down"
      | "left"
      | "right";
    const rect = nudgeNormalizedRect({
      rect: box.rect,
      direction,
      amount: event.shiftKey ? 0.02 : 0.005,
    });

    onUpdateBoxRect(box.id, rect);
  }

  function handleStagePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (!target.closest("[data-field-box-overlay='true']")) {
      onSelectBox(null);
    }
  }

  const canRenderBoxes = stageSize.width > 0 && stageSize.height > 0;
  const minWidth = Math.min(
    stageSize.width,
    Math.max(16, CUSTOM_DESIGN_LIMITS.minBoxWidthNormalized * stageSize.width),
  );
  const minHeight = Math.min(
    stageSize.height,
    Math.max(14, CUSTOM_DESIGN_LIMITS.minBoxHeightNormalized * stageSize.height),
  );

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-line bg-muted p-3">
      <div
        ref={stageRef}
        onPointerDown={handleStagePointerDown}
        className="relative rounded bg-panel shadow-sm"
        style={{
          aspectRatio: `${asset.intrinsicWidth} / ${asset.intrinsicHeight}`,
          width: stageWidthByViewportHeight,
        }}
      >
        {imgUrl ? (
          <img
            src={imgUrl}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full rounded object-contain"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center rounded p-6 text-center text-sm text-muted-foreground">
            Image preview is unavailable. Remove the design and upload it again.
          </div>
        )}

        <div className="absolute inset-0">
          {canRenderBoxes
            ? boxes.map((box) => {
                const selected = box.id === selectedBoxId;
                const pixelRect = normalizedRectToPixelRect({
                  rect: box.rect,
                  containerWidth: stageSize.width,
                  containerHeight: stageSize.height,
                });
                const label = boxLabel(box);

                return (
                  <Rnd
                    key={box.id}
                    data-field-box-overlay="true"
                    bounds="parent"
                    size={{ width: pixelRect.width, height: pixelRect.height }}
                    position={{ x: pixelRect.x, y: pixelRect.y }}
                    minWidth={minWidth}
                    minHeight={minHeight}
                    maxWidth={stageSize.width}
                    maxHeight={stageSize.height}
                    dragHandleClassName="custom-field-drag-surface"
                    enableResizing={selected ? resizeDirections : false}
                    resizeHandleStyles={selected ? resizeHandleStyles : undefined}
                    style={{ zIndex: selected ? 20 : 10 }}
                    onDragStart={() => {
                      onSelectBox(box.id);
                    }}
                    onDrag={(_event, data) => {
                      commitPixelRect(
                        box.id,
                        data.x,
                        data.y,
                        pixelRect.width,
                        pixelRect.height,
                      );
                    }}
                    onResizeStart={() => {
                      onSelectBox(box.id);
                    }}
                    onResize={(_event, _direction, element, _delta, position) => {
                      commitPixelRect(
                        box.id,
                        position.x,
                        position.y,
                        element.offsetWidth,
                        element.offsetHeight,
                      );
                    }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label={`Field box: ${label}`}
                      onFocus={() => onSelectBox(box.id)}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        event.currentTarget.focus({ preventScroll: true });
                        onSelectBox(box.id);
                      }}
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => handleKeyDown(box, event)}
                      className={[
                        "custom-field-drag-surface flex h-full w-full touch-none select-none overflow-hidden rounded border bg-panel/80 shadow-sm backdrop-blur-[1px]",
                        selected
                          ? "cursor-move border-accent ring-2 ring-accent"
                          : "cursor-grab border-ink/40 hover:border-accent active:cursor-grabbing",
                      ].join(" ")}
                      style={{
                        color: box.style.color,
                        alignItems: verticalPosition(box.style.verticalAlign),
                        justifyContent: horizontalPosition(box.style.align),
                        textAlign: box.style.align,
                        fontFamily: cssFontFamily(box.style.fontFamily),
                        fontWeight: box.style.fontWeight === "bold" ? 700 : 400,
                        fontSize: `${Math.max(9, Math.min(box.style.fontSize, 28))}px`,
                        lineHeight: box.style.lineHeight,
                      }}
                    >
                      <span
                        className="block min-w-0 px-2 py-1"
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: box.style.overflowMode === "wrap" ? "normal" : "nowrap",
                          textTransform: box.style.uppercase ? "uppercase" : "none",
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  </Rnd>
                );
              })
            : null}
        </div>
      </div>

      <p className="text-center text-xs leading-5 text-muted-foreground">
        Drag a field to move it. Select it, then drag any handle to resize. Arrow keys nudge; hold Shift for a bigger step.
      </p>
    </div>
  );
}
