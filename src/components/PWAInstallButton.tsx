import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'banner' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  // If already running inside standalone app, do not display install CTA
  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary-container/30 text-secondary text-xs font-semibold">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>Installed as Android App</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setInstalling(true);
      await install();
      setInstalling(false);
    } else {
      // Guide the user for Android Chrome / Mobile browser
      setShowAndroidGuide(true);
    }
  };

  if (variant === 'banner') {
    return (
      <div className={`p-3 rounded-2xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-secondary text-on-secondary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">android</span>
          </div>
          <div>
            <span className="text-xs font-bold text-on-surface block leading-tight">
              Install Rhythm App
            </span>
            <span className="text-[11px] text-on-surface-variant">
              100% Free • Works offline on Android
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInstallClick}
          disabled={installing}
          className="px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0"
        >
          <span className="material-symbols-outlined text-[14px]">download</span>
          <span>{installing ? 'Installing...' : 'Install'}</span>
        </button>

        {showAndroidGuide && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest max-w-xs w-full rounded-3xl p-5 shadow-2xl border border-surface-container space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-secondary-container text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">install_mobile</span>
                  </span>
                  <h3 className="text-sm font-bold text-on-surface">Install on Android</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAndroidGuide(false)}
                  className="w-7 h-7 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="space-y-3 text-xs text-on-surface-variant leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-surface-container text-[11px] font-bold text-on-surface flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>Tap the Chrome menu button (<strong>⋮</strong> three dots) in the top right.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-surface-container text-[11px] font-bold text-on-surface flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-surface-container text-[11px] font-bold text-on-surface flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>Confirm by tapping <strong>Install</strong>. Rhythm will appear in your Android app drawer!</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAndroidGuide(false)}
                className="w-full py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-neutral-800 transition-all cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Compact variant (e.g. for header or profile)
  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={installing}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-xs font-bold text-on-surface border border-surface-container/60 transition-all cursor-pointer shadow-2xs active:scale-95 ${className}`}
        title="Install Rhythm on Android device"
      >
        <span className="material-symbols-outlined text-[15px] text-secondary">install_mobile</span>
        <span>Install App</span>
      </button>

      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-xs w-full rounded-3xl p-5 shadow-2xl border border-surface-container space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-secondary-container text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">android</span>
                </span>
                <h3 className="text-sm font-bold text-on-surface">Install on Android</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAndroidGuide(false)}
                className="w-7 h-7 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs text-on-surface-variant leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-surface-container text-[11px] font-bold text-on-surface flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>Open this link in <strong>Chrome</strong> on your Android phone or tablet.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-surface-container text-[11px] font-bold text-on-surface flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>Tap the top-right menu (<strong>⋮</strong>) and tap <strong>"Install app"</strong>.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-surface-container text-[11px] font-bold text-on-surface flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>Tap <strong>Install</strong>. Rhythm installs natively with full offline support and zero app store fees!</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAndroidGuide(false)}
              className="w-full py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-neutral-800 transition-all cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
