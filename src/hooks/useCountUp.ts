'use client';

import { useEffect, useState } from 'react';

export function useCountUp(
  end: number,
  enabled: boolean,
  durationMs = 1400,
  decimals = 0,
) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(0);
      return;
    }

    let start: number | null = null;
    let frame: number;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Number((end * eased).toFixed(decimals)));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [end, enabled, durationMs, decimals]);

  return value;
}
