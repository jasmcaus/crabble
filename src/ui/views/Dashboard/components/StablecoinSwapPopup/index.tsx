import React from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as RcArrowRight } from '@/ui/assets/dashboard/stablecoin-swap-popup/arrow-right.svg';
import { ReactComponent as RcClose } from '@/ui/assets/dashboard/stablecoin-swap-popup/close.svg';
import { ReactComponent as RcMoreDot } from '@/ui/assets/dashboard/stablecoin-swap-popup/more-dot.svg';
import { ReactComponent as RcTokenSwitch } from '@/ui/assets/dashboard/stablecoin-swap-popup/token-switch.svg';
import { useStablecoinSwapPopup } from '../../hooks/ads/useStablecoinSwapPopup';

interface AnimatedTokenProps {
  token: {
    symbol: string;
    src: string;
  };
  previousToken: {
    symbol: string;
    src: string;
  } | null;
  onAnimationEnd(): void;
}

const AnimatedToken: React.FC<AnimatedTokenProps> = ({
  token,
  previousToken,
  onAnimationEnd,
}) => (
  <div
    role="img"
    aria-label={token.symbol}
    className="relative block h-[20px] w-[20px] flex-none overflow-hidden"
  >
    {previousToken && (
      <img
        src={previousToken.src}
        alt=""
        className="stablecoin-swap-popup-token-exit absolute left-0 top-0 block h-[20px] w-[20px] max-w-none"
      />
    )}
    <img
      src={token.src}
      alt=""
      onAnimationEnd={onAnimationEnd}
      className={`block h-[20px] w-[20px] max-w-none ${
        previousToken ? 'stablecoin-swap-popup-token-enter' : ''
      }`}
    />
  </div>
);

/** Bottom promotion displayed over the popup Dashboard. */
export const StablecoinSwapPopup: React.FC = () => {
  const { t } = useTranslation();
  const {
    visible,
    onClose,
    onHover,
    onSwap,
    supportedStablecoinIcons,
    payToken,
    previousPayToken,
    receiveToken,
    previousReceiveToken,
    onPayTokenAnimationEnd,
    onReceiveTokenAnimationEnd,
  } = useStablecoinSwapPopup();

  if (!visible) {
    return null;
  }

  return (
    <section
      role="dialog"
      aria-label={t('page.dashboard.home.stablecoinSwapPopup.title')}
      onMouseEnter={onHover}
      className="group absolute bottom-[-118px] left-0 z-20 h-[182px] w-full overflow-hidden rounded-t-[20px] bg-[var(--crb-popover)] shadow-[var(--crb-shadow-pop)] transition-[bottom] duration-300 ease-out hover:bottom-0"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[80px] bg-[radial-gradient(60%_100%_at_50%_0%,var(--r-blue-light1),transparent)]" />

      <button
        type="button"
        onClick={onClose}
        aria-label={t('page.dashboard.home.stablecoinSwapPopup.close')}
        className="absolute right-[10px] top-[10px] flex h-[26px] w-[26px] items-center justify-center rounded-full border-0 bg-transparent hover:bg-[var(--crb-hover)] transition-colors"
      >
        <RcClose className="h-[12px] w-[12px] text-r-neutral-foot" />
      </button>

      <div className="absolute left-1/2 top-[16px] flex -translate-x-1/2 items-center gap-[12px] whitespace-nowrap text-[15px] leading-[20px] font-semibold tracking-[-0.01em] text-r-neutral-title1">
        <span>{t('page.dashboard.home.stablecoinSwapPopup.title')}</span>
        <AnimatedToken
          token={payToken}
          previousToken={previousPayToken}
          onAnimationEnd={onPayTokenAnimationEnd}
        />
        <RcTokenSwitch
          aria-hidden="true"
          className="h-[14px] w-[14px] flex-none text-r-neutral-title1"
        />
        <AnimatedToken
          token={receiveToken}
          previousToken={previousReceiveToken}
          onAnimationEnd={onReceiveTokenAnimationEnd}
        />
      </div>

      <div className="absolute left-1/2 top-[52px] flex -translate-x-1/2 flex-col items-center gap-[8px] transition-[top] duration-300 ease-out group-hover:top-[60px]">
        <div className="flex h-[20px] items-end gap-[8px]">
          {supportedStablecoinIcons.map((icon) => (
            <img
              key={icon}
              src={icon}
              alt=""
              className="h-[20px] w-[20px] opacity-60"
            />
          ))}
          <span
            aria-hidden="true"
            className="flex h-[20px] items-center gap-[2px]"
          >
            {Array.from({ length: 3 }).map((_, index) => (
              <RcMoreDot
                key={index}
                className="h-[3px] w-[3px] text-r-neutral-foot"
              />
            ))}
          </span>
        </div>

        <p className="whitespace-nowrap text-[12px] leading-[14px] text-r-neutral-title1 opacity-80">
          {t('page.dashboard.home.stablecoinSwapPopup.supportPrefix')}{' '}
          <strong className="font-bold">
            {t('page.dashboard.home.stablecoinSwapPopup.supportCount')}
          </strong>{' '}
          {t('page.dashboard.home.stablecoinSwapPopup.supportSuffix')}
        </p>
      </div>

      <button
        type="button"
        onClick={onSwap}
        className="absolute left-1/2 top-[126px] flex h-[38px] w-[240px] -translate-x-1/2 cursor-pointer items-center justify-center gap-[6px] rounded-[12px] border-0 bg-r-neutral-title1 text-[14px] leading-[18px] font-semibold text-r-neutral-bg1 hover:opacity-90 active:scale-[0.98] transition-[opacity,transform]"
      >
        <span>{t('page.dashboard.home.stablecoinSwapPopup.goToSwap')}</span>
        <RcArrowRight className="h-[14px] w-[14px]" />
      </button>
    </section>
  );
};
