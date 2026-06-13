"use client";

/* eslint-disable @next/next/no-img-element -- Local object URLs cannot be optimized by next/image. */

import { useEffect, useRef, useState } from "react";
import { FieldBoxOverlay } from "./FieldBoxOverlay";
import {
  nudgeNormalizedRect,
  resizeNormalizedRect,
  type ResizeHandle,
} from "@/lib/batch-pdf/custom/editor-geometry";
import { moveNormalizedRect } from "@/lib/batch-pdf/custom/editor-geometry";
import { renderPdfPreviewToCanvas } from "@/lib/batch-pdf/custom/pdf-preview.client";
import type {
  CustomFieldBox,
  DesignAsset,
  NormalizedRect,
} from "@/lib/batch-pdf/custom/types";

type Interaction =
  | {
      type: "move";
      boxId: string;
      startClientX: number;
      startClientY: number;
      startRect: NormalizedRect;
    }
  | {
      type: "resize";
      boxId: string;
      handle: ResizeHandle;
      startClientX: number;
      startClientY: number;
      startRect: NormalizedRect;
    };

type CustomDesignStageProps = {
  file: File | null;
  asset: DesignAsset;
  previewUrl: string | null;
  boxes: CustomFieldBox[];
  selectedBoxId: string | null;
  onSelectBox: (boxId: string | null) => void;
  onUpdateBoxRect: (boxId: string, rect: NormalizedRect) => void;
};

export function CustomDesignStage({
  file,
  asset,
  previewUrl,
  boxes,
  selectedBoxId,
  onSelectBox,
  onUpdateBoxRect,
}: CustomDesignStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [pdfPreviewFailedFileName, setPdfPreviewFailedFileName] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!file || asset.kind !== "pdf" || !canvasRef.current) {
      return;
    }

    let cancelled = false;

    renderPdfPreviewToCanvas({ file, canvas: canvasRef.current }).then((result) => {
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setPdfPreviewFailedFileName(file.name);
        return;
      }

      setPdfPreviewFailedFileName(null);
    });

    return () => {
      cancelled = true;
    };
  }, [asset.kind, file]);

  const pdfPreviewFailed = Boolean(
    file && pdfPreviewFailedFileName === file.name,
  );

  function getStageRect(): DOMRect | null {
    return stageRef.current?.getBoundingClientRect() ?? null;
  }

  function handleMoveStart(
    boxId: string,
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    const box = boxes.find((candidate) => candidate.id === boxId);

    if (!box || !stageRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    stageRef.current.setPointerCapture(event.pointerId);
    onSelectBox(boxId);
    setInteraction({
      type: "move",
      boxId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startRect: box.rect,
    });
  }

  function handleResizeStart(
    boxId: string,
    handle: ResizeHandle,
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    const box = boxes.find((candidate) => candidate.id === boxId);

    if (!box || !stageRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    stageRef.current.setPointerCapture(event.pointerId);
    onSelectBox(boxId);
    setInteraction({
      type: "resize",
      boxId,
      handle,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startRect: box.rect,
    });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!interaction) {
      return;
    }

    const rect = getStageRect();

    if (!rect) {
      return;
    }

    const deltaX = (event.clientX - interaction.startClientX) / rect.width;
    const deltaY = (event.clientY - interaction.startClientY) / rect.height;
    const nextRect =
      interaction.type === "move"
        ? moveNormalizedRect({
            rect: interaction.startRect,
            deltaX,
            deltaY,
          })
        : resizeNormalizedRect({
            rect: interaction.startRect,
            handle: interaction.handle,
            deltaX,
            deltaY,
          });

    onUpdateBoxRect(interaction.boxId, nextRect);
  }

  function finishInteraction(event: React.PointerEvent<HTMLDivElement>) {
    if (stageRef.current?.hasPointerCapture(event.pointerId)) {
      stageRef.current.releasePointerCapture(event.pointerId);
    }

    setInteraction(null);
  }

  function handleKeyDown(
    boxId: string,
    event: React.KeyboardEvent<HTMLDivElement>,
  ) {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      return;
    }

    const box = boxes.find((candidate) => candidate.id === boxId);

    if (!box) {
      return;
    }

    event.preventDefault();
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

    onUpdateBoxRect(boxId, rect);
  }

  return (
    <div className="rounded-lg border border-line bg-muted p-3">
      <div
        ref={stageRef}
        onClick={() => onSelectBox(null)}
        onPointerMove={handlePointerMove}
        onPointerUp={finishInteraction}
        onPointerCancel={finishInteraction}
        className="relative mx-auto w-full max-w-5xl overflow-hidden rounded bg-panel shadow-sm"
        style={{ aspectRatio: `${asset.intrinsicWidth} / ${asset.intrinsicHeight}` }}
      >
        {asset.kind === "png" || asset.kind === "jpeg" ? (
          previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
              Image preview is unavailable. Remove the design and upload it again.
            </div>
          )
        ) : (
          <>
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full bg-panel"
              aria-label="PDF design placement preview"
            />
            {pdfPreviewFailed ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted p-6 text-center text-sm text-muted-foreground">
                PDF preview is unavailable for placement.
              </div>
            ) : null}
          </>
        )}

        <div className="absolute inset-0">
          {boxes.map((box) => (
            <FieldBoxOverlay
              key={box.id}
              box={box}
              selected={box.id === selectedBoxId}
              onSelect={onSelectBox}
              onMoveStart={handleMoveStart}
              onResizeStart={handleResizeStart}
              onKeyDown={handleKeyDown}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
