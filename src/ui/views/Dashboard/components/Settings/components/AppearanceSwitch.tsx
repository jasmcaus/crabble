import { DARK_MODE_TYPE } from '@/constant';
import { cn } from '@/ui/component/ui/cn';
import { useRabbyDispatch, useRabbySelector } from '@/ui/store';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

type Palette = {
  bg: string;
  card: string;
  line: string;
  ink: string;
};

const LIGHT: Palette = {
  bg: '#f6f6f7',
  card: '#ffffff',
  line: '#e4e4e7',
  ink: '#09090b',
};

const DARK: Palette = {
  bg: '#09090b',
  card: '#18181b',
  line: '#27272a',
  ink: '#fafafa',
};

/** A tiny wallet screen drawn in one palette. */
const MiniScreen: React.FC<{ palette: Palette; className?: string }> = ({
  palette,
  className,
}) => (
  <div
    className={cn(
      'absolute inset-0 p-[8px] flex flex-col gap-[5px]',
      className
    )}
    style={{ background: palette.bg }}
  >
    <div className="flex items-center gap-[4px]">
      <span
        className="w-[10px] h-[10px] rounded-full"
        style={{ background: palette.line }}
      />
      <span
        className="h-[4px] w-[24px] rounded-full"
        style={{ background: palette.line }}
      />
    </div>
    <span
      className="h-[7px] w-[44px] rounded-[2px]"
      style={{ background: palette.ink }}
    />
    <svg viewBox="0 0 80 14" className="w-full h-[12px]" aria-hidden>
      <path
        d="M0 9 L12 7 L22 8 L32 4 L44 6 L54 10 L64 9 L80 5"
        fill="none"
        stroke="#e8552a"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <div
      className="mt-auto rounded-[4px] h-[14px] flex items-center px-[4px] gap-[3px]"
      style={{
        background: palette.card,
        boxShadow: `0 0 0 0.5px ${palette.line}`,
      }}
    >
      <span
        className="w-[6px] h-[6px] rounded-full"
        style={{ background: palette.line }}
      />
      <span
        className="h-[3px] w-[20px] rounded-full"
        style={{ background: palette.line }}
      />
    </div>
  </div>
);

/**
 * Light / Dark / System picker shown at the top of Settings. Each option is
 * a miniature of the wallet in that theme; System is split down the middle.
 */
export const AppearanceSwitch: React.FC<{ className?: string }> = ({
  className,
}) => {
  const { t } = useTranslation();
  const dispatch = useRabbyDispatch();
  const themeMode = useRabbySelector((state) => state.preference.themeMode);

  const options = [
    {
      value: DARK_MODE_TYPE.light,
      label: t('page.dashboard.settings.appearance.light'),
      icon: Sun,
      preview: <MiniScreen palette={LIGHT} />,
    },
    {
      value: DARK_MODE_TYPE.dark,
      label: t('page.dashboard.settings.appearance.dark'),
      icon: Moon,
      preview: <MiniScreen palette={DARK} />,
    },
    {
      value: DARK_MODE_TYPE.system,
      label: t('page.dashboard.settings.appearance.system'),
      icon: Monitor,
      preview: (
        <>
          <MiniScreen palette={LIGHT} />
          <MiniScreen
            palette={DARK}
            className="[clip-path:polygon(55%_0,100%_0,100%_100%,45%_100%)]"
          />
        </>
      ),
    },
  ];

  return (
    <ToggleGroup.Root
      type="single"
      aria-label={t('page.dashboard.settings.appearance.title')}
      value={String(themeMode)}
      onValueChange={(next) => {
        if (!next) return;
        dispatch.preference.switchThemeMode(Number(next) as DARK_MODE_TYPE);
      }}
      className={cn('grid grid-cols-3 gap-[10px]', className)}
    >
      {options.map((option) => {
        const active = themeMode === option.value;
        const Icon = option.icon;
        return (
          <ToggleGroup.Item
            key={option.value}
            value={String(option.value)}
            className={cn(
              'group flex flex-col items-stretch gap-[8px] p-0 border-0 bg-transparent cursor-pointer text-left'
            )}
          >
            <span
              className={cn(
                'relative block h-[64px] rounded-[12px] overflow-hidden',
                'transition-[box-shadow,transform] duration-200',
                active
                  ? 'shadow-[0_0_0_2px_var(--r-blue-default),0_0_0_5px_var(--crb-ring-color)]'
                  : 'shadow-[0_0_0_1px_var(--crb-hairline-strong)] group-hover:shadow-[0_0_0_1px_var(--r-neutral-foot)]'
              )}
            >
              {option.preview}
              {active && (
                <span className="absolute top-[6px] right-[6px] w-[16px] h-[16px] rounded-full bg-r-blue-default text-white flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
                  <Check size={10} strokeWidth={3.5} />
                </span>
              )}
            </span>
            <span
              className={cn(
                'flex items-center justify-center gap-[5px] text-[13px] leading-[16px] font-semibold',
                active ? 'text-r-neutral-title1' : 'text-r-neutral-foot'
              )}
            >
              <Icon size={13} strokeWidth={2.25} />
              {option.label}
            </span>
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup.Root>
  );
};
