import { Tooltip } from 'antd';
import React from 'react';
import { cn } from './cn';

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  /** show the label as a tooltip (default) */
  tooltip?: boolean;
  /** a small dot in the corner (pending state, update available) */
  dot?: 'brand' | 'danger' | false;
  /** a count badge in the corner */
  count?: number;
  size?: 'sm' | 'md';
  variant?: 'ghost' | 'outline';
};

/** Square icon button for headers and toolbars (shadcn "icon" button). */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      label,
      tooltip = true,
      dot,
      count,
      size = 'md',
      variant = 'ghost',
      className,
      children,
      ...rest
    },
    ref
  ) => {
    const button = (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        className={cn(
          'crb-icon-btn relative border-0 bg-transparent p-0',
          size === 'sm' && 'w-[28px] h-[28px] rounded-[8px]',
          variant === 'outline' &&
            'bg-[var(--crb-raised)] shadow-[var(--crb-shadow-card)]',
          className
        )}
        {...rest}
      >
        {children}
        {!!count && count > 0 && (
          <span className="absolute -top-[3px] -right-[3px] min-w-[16px] h-[16px] px-[4px] rounded-full bg-r-blue-default text-white text-[10px] leading-[16px] font-semibold tabular-nums text-center ring-2 ring-[var(--r-neutral-bg-2)]">
            {count > 99 ? '99+' : count}
          </span>
        )}
        {!count && dot && (
          <span
            className={cn(
              'absolute top-[6px] right-[6px] w-[6px] h-[6px] rounded-full ring-2 ring-[var(--r-neutral-bg-2)]',
              dot === 'danger' ? 'bg-r-red-default' : 'bg-r-blue-default'
            )}
          />
        )}
      </button>
    );

    if (!tooltip) return button;

    return (
      <Tooltip
        title={label}
        placement="bottom"
        overlayClassName="rectangle"
        mouseEnterDelay={0.35}
        align={{ offset: [0, -2] }}
      >
        {button}
      </Tooltip>
    );
  }
);

IconButton.displayName = 'IconButton';
