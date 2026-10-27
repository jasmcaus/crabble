import { KEYRING_CLASS } from '@/constant';
import { useBrandIcon } from '@/ui/hooks/useBrandIcon';
import { blockiePaths, createBlockie } from '@/ui/utils/blockies';
import { Eye } from 'lucide-react';
import React, { useMemo } from 'react';
import { CommonSignal } from '../ConnectStatus/CommonSignal';
import { cn } from './cn';

type AddressAvatarProps = {
  address: string;
  /** keyring type; enables the corner badge and connection signal */
  type?: string;
  brandName?: string;
  size?: number;
  /** draw the keyring badge (watch-only eye, hardware/brand logo) */
  badge?: boolean;
  /** draw the hardware/WalletConnect connection dot */
  signal?: boolean;
  className?: string;
};

// seed phrase and private key accounts are the default; anything else
// (watch-only, hardware, WalletConnect, Safe…) gets a badge so the account
// kind is still readable without the old keyring glyph
const UNBADGED = new Set<string>([
  KEYRING_CLASS.MNEMONIC,
  KEYRING_CLASS.PRIVATE_KEY,
]);

export const Blockie = ({
  address,
  size,
  className,
}: {
  address: string;
  size: number;
  className?: string;
}) => {
  const { bgcolor, color, spotcolor, paths } = useMemo(() => {
    const blockie = createBlockie(address);
    return { ...blockie, paths: blockiePaths(blockie) };
  }, [address]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      aria-hidden
      className={cn('block shrink-0', className)}
    >
      <rect width="8" height="8" fill={bgcolor} />
      <path d={paths.color} fill={color} />
      <path d={paths.spot} fill={spotcolor} />
    </svg>
  );
};

const BrandBadge = ({
  address,
  type,
  brandName,
  size,
}: {
  address: string;
  type: string;
  brandName: string;
  size: number;
}) => {
  const icon = useBrandIcon({ address, type, brandName });
  if (!icon) return null;
  return (
    <img
      src={icon}
      alt=""
      className="block rounded-full"
      style={{ width: size, height: size }}
    />
  );
};

/**
 * An account's identicon: the address blockie on a rounded square, with the
 * keyring kind as a corner badge when it isn't a plain seed phrase or key.
 */
export const AddressAvatar = ({
  address,
  type,
  brandName,
  size = 36,
  badge = true,
  signal = true,
  className,
}: AddressAvatarProps) => {
  const showBadge = badge && !!type && !UNBADGED.has(type);
  const badgeSize = Math.max(14, Math.round(size * 0.44));
  const radius = Math.round(size * 0.28);

  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <div
        className="w-full h-full overflow-hidden shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"
        style={{ borderRadius: radius }}
      >
        <Blockie address={address} size={size} />
      </div>
      {showBadge && (
        <span
          className={cn(
            'absolute -right-[4px] -bottom-[4px] flex items-center justify-center rounded-full',
            'bg-r-neutral-bg1 ring-2 ring-[var(--r-neutral-bg1)] text-r-neutral-title1'
          )}
          style={{ width: badgeSize, height: badgeSize }}
        >
          {type === KEYRING_CLASS.WATCH ? (
            <Eye size={Math.round(badgeSize * 0.68)} strokeWidth={2.25} />
          ) : (
            <BrandBadge
              address={address}
              type={type!}
              brandName={brandName || type!}
              size={badgeSize}
            />
          )}
        </span>
      )}
      {signal && type && (
        <CommonSignal
          type={type}
          brandName={brandName || ''}
          address={address}
          className="-top-[2px] -right-[2px] bottom-auto"
        />
      )}
    </div>
  );
};
