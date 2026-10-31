import React, { useEffect, useState } from 'react';
import { IconRadioTower } from './Icons';

export interface StationAvatarProps {
  logoUrl: string | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  accentFallback?: boolean;
  onResolveLogo?: (logoUrl: string) => Promise<string | null>;
}

const clientLogoCache = new Map<string, string | null>();

export const StationAvatar: React.FC<StationAvatarProps> = ({
  logoUrl,
  size = 'sm',
  accentFallback = false,
  onResolveLogo
}) => {
  const cleanUrl = logoUrl?.trim() || null;
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(cleanUrl);
  const [attemptedProxy, setAttemptedProxy] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(!cleanUrl);

  useEffect(() => {
    if (!cleanUrl) {
      setResolvedSrc(null);
      setFailed(true);
      setAttemptedProxy(false);
      return;
    }

    if (clientLogoCache.has(cleanUrl)) {
      const cached = clientLogoCache.get(cleanUrl) ?? null;
      setResolvedSrc(cached);
      setFailed(!cached);
      setAttemptedProxy(true);
      return;
    }

    // If URL is a .ico or plain http://, proactively resolve through main process proxy so .ico renders reliably
    const isIcoOrHttp =
      /\.ico(\?|$)/i.test(cleanUrl) || cleanUrl.startsWith('http://');

    if (isIcoOrHttp && onResolveLogo) {
      setAttemptedProxy(true);
      setFailed(false);
      setResolvedSrc(cleanUrl);
      void onResolveLogo(cleanUrl).then((dataUrl) => {
        if (dataUrl) {
          clientLogoCache.set(cleanUrl, dataUrl);
          setResolvedSrc(dataUrl);
          setFailed(false);
        }
      });
    } else {
      setResolvedSrc(cleanUrl);
      setAttemptedProxy(false);
      setFailed(false);
    }
  }, [cleanUrl]);

  const handleImageError = () => {
    if (!cleanUrl) {
      setFailed(true);
      return;
    }

    if (!attemptedProxy && onResolveLogo) {
      setAttemptedProxy(true);
      void onResolveLogo(cleanUrl).then((dataUrl) => {
        clientLogoCache.set(cleanUrl, dataUrl);
        if (dataUrl) {
          setResolvedSrc(dataUrl);
          setFailed(false);
        } else {
          setFailed(true);
        }
      });
      return;
    }

    clientLogoCache.set(cleanUrl, null);
    setFailed(true);
  };

  const sizeClasses =
    size === 'lg'
      ? 'w-11 h-11 rounded-[10px]'
      : size === 'md'
        ? 'w-10 h-10 rounded-[9px]'
        : size === 'xs'
          ? 'w-6 h-6 rounded-[6px]'
          : 'w-8 h-8 rounded-[8px]';

  const iconSize =
    size === 'lg' ? 20 : size === 'md' ? 18 : size === 'xs' ? 12 : 15;

  if (!resolvedSrc || failed) {
    return (
      <div
        className={`${sizeClasses} shrink-0 flex items-center justify-center transition-transform duration-150 ${
          accentFallback
            ? 'bg-accent text-white shadow-sm'
            : 'mac-glass-pill text-secondary'
        }`}
      >
        <IconRadioTower size={iconSize} />
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt=""
      referrerPolicy="no-referrer"
      decoding="async"
      onError={handleImageError}
      className={`${sizeClasses} object-cover shrink-0 border border-white/15 bg-black/20 shadow-sm transition-transform duration-150`}
    />
  );
};
