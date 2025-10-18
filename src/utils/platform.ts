export type RuntimePlatform = 'ios' | 'android' | 'other';

const isNavigatorAvailable = (): boolean => typeof navigator !== 'undefined';

const hasMultiTouchMac = (): boolean => {
  if (!isNavigatorAvailable()) {
    return false;
  }

  const platform = navigator.platform || '';
  return platform === 'MacIntel' && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1;
};

export const isIOSDevice = (): boolean => {
  if (!isNavigatorAvailable()) {
    return false;
  }

  const ua = navigator.userAgent || '';

  return /iPad|iPhone|iPod/i.test(ua) || hasMultiTouchMac();
};

export const isAndroidDevice = (): boolean => {
  if (!isNavigatorAvailable()) {
    return false;
  }

  const ua = navigator.userAgent || navigator.vendor || '';
  return /android/i.test(ua);
};

export const detectRuntimePlatform = (): RuntimePlatform => {
  if (isIOSDevice()) {
    return 'ios';
  }

  if (isAndroidDevice()) {
    return 'android';
  }

  return 'other';
};
