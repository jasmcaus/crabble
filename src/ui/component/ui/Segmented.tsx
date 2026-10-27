import React, { useLayoutEffect, useRef, useState } from 'react';
import { cn } from './cn';
import { handleRadioGroupKeyDown } from './radioKeys';

export type SegmentedOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
};

type SegmentedProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  /** stretch the items to fill the track */
  block?: boolean;
  /** "pill" is a sunken track with a raised thumb; "tabs" is bare text tabs
   * with an ink underline */
  variant?: 'pill' | 'tabs';
  className?: string;
  'aria-label'?: string;
};

type ThumbRect = { x: number; width: number };

/**
 * Single-select segmented control: a radio group with roving focus and
 * arrow-key selection. One thumb slides under the active item on a CSS
 * transition; it is measured from the item so labels of any width work.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  block,
  variant = 'pill',
  className,
  'aria-label': ariaLabel,
}: SegmentedProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<ThumbRect | null>(null);
  // the first placement must not animate in from the left edge
  const [animate, setAnimate] = useState(false);

  const activeIndex = options.findIndex((option) => option.value === value);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const item = track.querySelectorAll<HTMLElement>('[role="radio"]')[
        activeIndex
      ];
      setThumb(item ? { x: item.offsetLeft, width: item.offsetWidth } : null);
    };
    measure();

    // labels change width when fonts load, the locale switches or the
    // track is stretched by its container
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [activeIndex, options.length, size, variant]);

  useLayoutEffect(() => {
    if (!thumb || animate) return;
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, [thumb, animate]);

  return (
    <div
      ref={trackRef}
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={(event) =>
        handleRadioGroupKeyDown(event, options, value, onChange)
      }
      className={cn(
        'crb-segmented',
        `is-${variant}`,
        `is-${size}`,
        block && 'is-block',
        className
      )}
    >
      {thumb && (
        <span
          aria-hidden
          className={cn('crb-segmented-thumb', animate && 'is-animated')}
          style={{
            width: thumb.width,
            transform: `translateX(${thumb.x}px)`,
          }}
        />
      )}
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active || (activeIndex < 0 && !option.disabled) ? 0 : -1}
            disabled={option.disabled}
            onClick={() => !active && onChange(option.value)}
            className={cn('crb-segmented-item', active && 'is-active')}
          >
            <span className="crb-segmented-label">
              {option.icon}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
