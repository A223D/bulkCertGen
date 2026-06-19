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
  previewUrl: _previewUrl,
  boxes,
  selectedBoxId,
  onSelectBox,
  onUpdateBoxRect,
}: CustomDesignStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const suppressNextStageClickRef = useRef(false);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
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
    suppressNextStageClickRef.current = true;
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
    suppressNextStageClickRef.current = true;
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

  function handleStageClick(event: React.MouseEvent<HTMLDivElement>) {
    if (suppressNextStageClickRef.current) {
      suppressNextStageClickRef.current = false;
      return;
    }

    const target = event.target as HTMLElement;

    if (target.closest("[data-field-box-overlay='true']")) {
      return;
    }

    onSelectBox(null);
  }

  return (
    <div className="flex justify-center rounded-lg border border-line bg-muted p-3">
      <div
        ref={stageRef}
        onClick={handleStageClick}
        onPointerMove={handlePointerMove}
        onPointerUp={finishInteraction}
        onPointerCancel={finishInteraction}
        className="relative overflow-hidden rounded bg-panel shadow-sm"
        style={{
          aspectRatio: `${asset.intrinsicWidth} / ${asset.intrinsicHeight}`,
          width: stageWidthByViewportHeight,
        }}
      >
        {imgUrl ? (
          <img
            src={imgUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Image preview is unavailable. Remove the design and upload it again.
          </div>
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
