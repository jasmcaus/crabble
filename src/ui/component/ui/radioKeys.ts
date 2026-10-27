import type React from 'react';

/**
 * Arrow / Home / End handling for a radio group whose items are buttons with
 * role="radio" and a roving tabIndex. Selects the next enabled item and moves
 * focus to it, wrapping at either end.
 */
export function handleRadioGroupKeyDown<T>(
  event: React.KeyboardEvent<HTMLElement>,
  items: { value: T; disabled?: boolean }[],
  current: T,
  onChange: (value: T) => void
) {
  const enabled = items.filter((item) => !item.disabled);
  if (!enabled.length) return;
  const index = enabled.findIndex((item) => item.value === current);

  let next: number;
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      next = (index + 1) % enabled.length;
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      next = (index - 1 + enabled.length) % enabled.length;
      break;
    case 'Home':
      next = 0;
      break;
    case 'End':
      next = enabled.length - 1;
      break;
    default:
      return;
  }

  event.preventDefault();
  const target = enabled[next];
  onChange(target.value);
  const buttons = event.currentTarget.querySelectorAll<HTMLElement>(
    '[role="radio"]'
  );
  buttons[items.indexOf(target)]?.focus();
}
