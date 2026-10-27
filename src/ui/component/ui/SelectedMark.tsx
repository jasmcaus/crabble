import { Check } from 'lucide-react';
import React from 'react';
import { cn } from './cn';

/** The filled check that marks the selected row in a list (account, chain…). */
export const SelectedMark = ({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <span
    className={cn(
      'inline-flex items-center justify-center shrink-0 rounded-full',
      'bg-r-neutral-title1 text-r-neutral-bg1',
      className
    )}
    style={{ width: size, height: size }}
  >
    <Check size={Math.round(size * 0.6)} strokeWidth={3} />
  </span>
);
