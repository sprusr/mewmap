import type { Camera, UI } from "./types.js";

export const ui = (): UI => {
  let lastTap: PointerEvent | null = null;
  let doubleTap: PointerEvent | null = null;
  let pointersDown = 0;

  let deinit: (() => void) | null = null;

  return {
    get interacting() {
      return pointersDown > 0;
    },
    init({ camera, svg }: { camera: Camera; svg: SVGSVGElement }): void {
      const resizeObserver = new ResizeObserver(([entry]) => {
        if (!entry?.borderBoxSize[0]) return;
        camera.resize({
          width: entry.borderBoxSize[0].inlineSize,
          height: entry.borderBoxSize[0].blockSize,
        });
        svg.setAttribute("viewBox", viewBoxForSvg(camera.viewBox));
      });
      resizeObserver.observe(svg);

      // prevent touch events - instead of touch-action: none as this causes
      // performance issues with complex SVGs
      const touchStart = (event: TouchEvent) => {
        event.preventDefault();
      };
      svg.addEventListener("touchstart", touchStart, { passive: false });
      const touchMove = (event: TouchEvent) => {
        event.preventDefault();
      };
      svg.addEventListener("touchmove", touchMove, { passive: false });

      const pointerDown = (event: PointerEvent) => {
        svg.setPointerCapture(event.pointerId);
        pointersDown++;

        // track double tap
        if (
          lastTap &&
          event.timeStamp - lastTap.timeStamp < 300 &&
          Math.hypot(
            event.clientX - lastTap.clientX,
            event.clientY - lastTap.clientY,
          ) < 30
        ) {
          doubleTap = event;
          lastTap = null;
        } else {
          lastTap = event;
        }
      };
      svg.addEventListener("pointerdown", pointerDown);

      const pointerUp = (event: PointerEvent) => {
        svg.releasePointerCapture(event.pointerId);
        pointersDown--;

        // double tap to zoom
        if (
          doubleTap &&
          event.timeStamp - doubleTap.timeStamp < 300 &&
          Math.hypot(
            event.clientX - doubleTap.clientX,
            event.clientY - doubleTap.clientY,
          ) < 30
        ) {
          camera.move({ zoom: camera.zoom + 0.5 });
        }

        doubleTap = null;
      };
      svg.addEventListener("pointerup", pointerUp);

      const pointerMove = (event: PointerEvent) => {
        if (event.buttons === 0) return;

        // double tap + drag to zoom
        if (doubleTap) {
          return camera.move({ zoom: camera.zoom - event.movementY / 100 });
        }

        // drag to pan
        if (event.buttons === 1) {
          const { x: previousX, y: previousY } = camera.screenToTile({
            x: event.offsetX - event.movementX,
            y: event.offsetY - event.movementY,
          });
          const { x, y } = camera.screenToTile({
            x: event.offsetX,
            y: event.offsetY,
          });
          const { longitude, latitude } = camera.tileToCoordinates({
            x: camera.x + previousX - x,
            y: camera.y + previousY - y,
          });
          return camera.move({ longitude, latitude });
        }
      };
      svg.addEventListener("pointermove", pointerMove);

      const wheel = (event: WheelEvent) => {
        // ctrl/cmd + wheel to zoom
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          camera.move({ zoom: camera.zoom - event.deltaY / 500 });
        }
      };
      svg.addEventListener("wheel", wheel, { passive: false });

      deinit = () => {
        resizeObserver.disconnect();
        svg.removeEventListener("touchstart", touchStart);
        svg.removeEventListener("touchmove", touchMove);
        svg.removeEventListener("pointerdown", pointerDown);
        svg.removeEventListener("pointerup", pointerUp);
        svg.removeEventListener("pointermove", pointerMove);
        svg.removeEventListener("wheel", wheel);
      };
    },
    destroy() {
      deinit?.();
      deinit = null;
      lastTap = null;
      doubleTap = null;
      pointersDown = 0;
    },
  };
};

const viewBoxForSvg = ({
  x,
  y,
  width,
  height,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}) => `${x} ${y} ${width} ${height}`;
