import React, { useCallback, useEffect, useRef, useState } from 'react';

export type RunawayButtonProps = {
  children: React.ReactNode;
  /** Called if user actually manages to click (e.g. keyboard / touch). */
  onClick?: () => void;
  className?: string;
  /** Random jump range in px (default ±160 x, ±80 y). */
  maxOffsetX?: number;
  maxOffsetY?: number;
  /** Trigger when pointer gets within this many px of the button bounds. */
  triggerDistance?: number;
  'aria-label'?: string;
};

/**
 * Button that moves away on hover / mouse move / focus so it's hard to click.
 */
export function RunawayButton({
  children,
  onClick,
  className = '',
  maxOffsetX = 160,
  maxOffsetY = 80,
  triggerDistance = 70,
  'aria-label': ariaLabel,
}: RunawayButtonProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const lastMoveAtRef = useRef(0);

  const moveAway = useCallback(() => {
    const x = Math.floor(Math.random() * (maxOffsetX * 2 + 1)) - maxOffsetX;
    const y = Math.floor(Math.random() * (maxOffsetY * 2 + 1)) - maxOffsetY;
    setOffset({ x, y });
  }, [maxOffsetX, maxOffsetY]);

  useEffect(() => {
    const onWindowMouseMove = (e: MouseEvent) => {
      const btn = buttonRef.current;
      if (!btn) return;

      // Small cooldown to prevent hyper-jitter and keep movement readable.
      const now = Date.now();
      if (now - lastMoveAtRef.current < 45) return;

      const rect = btn.getBoundingClientRect();
      const nearX = e.clientX >= rect.left - triggerDistance && e.clientX <= rect.right + triggerDistance;
      const nearY = e.clientY >= rect.top - triggerDistance && e.clientY <= rect.bottom + triggerDistance;

      if (nearX && nearY) {
        lastMoveAtRef.current = now;
        moveAway();
      }
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
    };
  }, [moveAway, triggerDistance]);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      onMouseEnter={moveAway}
      onMouseMove={moveAway}
      onPointerEnter={moveAway}
      onFocus={moveAway}
      className={`inline-flex items-center transition-transform duration-75 ${className}`}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
