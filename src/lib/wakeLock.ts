import { useState, useEffect, useCallback, useRef } from 'react';

export function useWakeLock(autoEnable: boolean = true) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const shouldBeActiveRef = useRef<boolean>(autoEnable);

  useEffect(() => {
    setIsSupported('wakeLock' in navigator);
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) {
      setError('WakeLock API is not supported on this browser');
      return false;
    }

    try {
      shouldBeActiveRef.current = true;
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        setIsActive(true);
        return true;
      }

      const sentinel = await navigator.wakeLock.request('screen');
      wakeLockRef.current = sentinel;
      setIsActive(true);
      setError(null);

      sentinel.addEventListener('release', () => {
        setIsActive(false);
      });

      return true;
    } catch (err: any) {
      console.warn('Wake Lock request error:', err);
      setError(err.message || 'Could not acquire Screen Wake Lock');
      setIsActive(false);
      return false;
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    shouldBeActiveRef.current = false;
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {
        console.warn('Wake Lock release error:', err);
      }
      wakeLockRef.current = null;
    }
    setIsActive(false);
  }, []);

  const toggleWakeLock = useCallback(async () => {
    if (isActive) {
      await releaseWakeLock();
    } else {
      await requestWakeLock();
    }
  }, [isActive, releaseWakeLock, requestWakeLock]);

  // Handle visibility change (re-request wake lock when user switches back to app)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && shouldBeActiveRef.current) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [requestWakeLock]);

  // Auto-enable on mount if requested
  useEffect(() => {
    if (autoEnable && 'wakeLock' in navigator) {
      requestWakeLock();
    }

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, [autoEnable, requestWakeLock]);

  return {
    isSupported,
    isActive,
    error,
    requestWakeLock,
    releaseWakeLock,
    toggleWakeLock,
  };
}
