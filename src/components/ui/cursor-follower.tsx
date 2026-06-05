'use client';

import { useEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";

interface CursorFollowerProps {
  containerRef: RefObject<HTMLElement | null>;
  defaultIcon?: ReactNode;
  hoverIcon?: ReactNode;
  interactiveSelector?: string;
}

export function CursorFollower({
  containerRef,
  defaultIcon,
  hoverIcon,
  interactiveSelector = 'a, button, [data-cursor-hover]',
}: CursorFollowerProps) {
  const mousePosition = useRef({ x: 0, y: 0 });
  const dotPosition = useRef({ x: 0, y: 0 });
  const borderDotPosition = useRef({ x: 0, y: 0 });
  const hoverStateRef = useRef(false);
  const [renderPos, setRenderPos] = useState({ dot: { x: 0, y: 0 }, border: { x: 0, y: 0 } });
  const [isActive, setIsActive] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const DOT_SMOOTHNESS = 0.2;
  const BORDER_DOT_SMOOTHNESS = 0.1;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      mousePosition.current = { x: event.clientX, y: event.clientY };
    };

    const handlePointerEnter = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      setIsActive(true);
      mousePosition.current = { x: event.clientX, y: event.clientY };
    };

    const handlePointerLeave = () => {
      setIsActive(false);
      setIsHovering(false);
      hoverStateRef.current = false;
    };

    container.addEventListener('pointerenter', handlePointerEnter);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);

    const animate = () => {
      const lerp = (start: number, end: number, factor: number) => {
        return start + (end - start) * factor;
      };

      dotPosition.current.x = lerp(dotPosition.current.x, mousePosition.current.x, DOT_SMOOTHNESS);
      dotPosition.current.y = lerp(dotPosition.current.y, mousePosition.current.y, DOT_SMOOTHNESS);

      borderDotPosition.current.x = lerp(borderDotPosition.current.x, mousePosition.current.x, BORDER_DOT_SMOOTHNESS);
      borderDotPosition.current.y = lerp(borderDotPosition.current.y, mousePosition.current.y, BORDER_DOT_SMOOTHNESS);

      const hoveredElement = document.elementFromPoint(mousePosition.current.x, mousePosition.current.y);
      const isInteractiveHover = Boolean(
        hoveredElement instanceof Element &&
        container.contains(hoveredElement) &&
        hoveredElement.closest(interactiveSelector)
      );

      if (hoverStateRef.current !== isInteractiveHover) {
        hoverStateRef.current = isInteractiveHover;
        setIsHovering(isInteractiveHover);
      }

      setRenderPos({
        dot: { x: dotPosition.current.x, y: dotPosition.current.y },
        border: { x: borderDotPosition.current.x, y: borderDotPosition.current.y },
      });

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => {
      container.removeEventListener('pointerenter', handlePointerEnter);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);

      cancelAnimationFrame(animationId);
    };
  }, [containerRef, interactiveSelector]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 hidden md:block"
      style={{ opacity: isActive ? 1 : 0, transition: 'opacity 120ms ease' }}
    >
      <div
        className="absolute rounded-full bg-white"
        style={{
          width: '8px',
          height: '8px',
          transform: 'translate(-50%, -50%)',
          left: `${renderPos.dot.x}px`,
          top: `${renderPos.dot.y}px`,
        }}
      />

      <div
        className="absolute flex items-center justify-center rounded-full border border-white bg-white/12 text-white backdrop-blur-md"
        style={{
          width: isHovering ? '40px' : '54px',
          height: isHovering ? '40px' : '54px',
          transform: 'translate(-50%, -50%)',
          left: `${renderPos.border.x}px`,
          top: `${renderPos.border.y}px`,
          transition: 'width 0.22s ease, height 0.22s ease, background-color 0.22s ease',
        }}
      >
        {isHovering ? hoverIcon : defaultIcon}
      </div>
    </div>
  );
}
