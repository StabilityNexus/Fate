import { useRef, useState, useEffect, useCallback } from "react";

const usePolling = (
  callback: () => void,
  interval: number = 5000,
  enabled: boolean = true
) => {
  const savedCallback = useRef(callback);
  const [isPolling, setIsPolling] = useState(enabled);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  });

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      savedCallback.current();
    }, interval);
    setIsPolling(true);
  }, [interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const togglePolling = useCallback(() => {
    if (intervalRef.current) {
      stopPolling();
    } else {
      startPolling();
    }
  }, [startPolling, stopPolling]);

  useEffect(() => {
    if (enabled && !intervalRef.current) {
      startPolling();
    } else if (!enabled && intervalRef.current) {
      stopPolling();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, startPolling, stopPolling]);

  return { isPolling, startPolling, stopPolling, togglePolling };
};

export { usePolling };