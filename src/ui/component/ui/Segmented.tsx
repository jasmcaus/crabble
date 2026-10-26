import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { motion } from 'motion/react';
import React, { useId } from 'react';
import { cn } from './cn';

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

/**
 * Single-select segmented control (Radix ToggleGroup for roving focus and
 * keyboard support, a Motion layout animation for the thumb).
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
  const id = useId();

  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      // Radix emits '' when the active item is pressed again; keep a value
      onValueChange={(next) => next && onChange(next as T)}
      aria-label={ariaLabel}
      className={cn(
        'crb-segmented',
        `is-${variant}`,
        `is-${size}`,
        block && 'is-block',
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <ToggleGroup.Item
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn('crb-segmented-item', active && 'is-active')}
          >
            {active && (
              <motion.span
                layoutId={`crb-seg-${id}`}
                className="crb-segmented-thumb"
                transition={{ type: 'spring', stiffness: 520, damping: 40 }}
              />
            )}
            <span className="crb-segmented-label">
              {option.icon}
              {option.label}
            </span>
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup.Root>
  );
}
