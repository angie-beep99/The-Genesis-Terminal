'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

export function useAnimatedCounter(
  end: number,
  duration: number = 1200,
  prefix: string = '',
  startOnMount: boolean = true
) {
  const [displayValue, setDisplayValue] = useState(prefix + '0');
  const [hasStarted, setHasStarted] = useState(false);
  const frameRef = useRef<number>();

  const start = useCallback(() => {
    setHasStarted(true);
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * end);

      if (prefix === '$') {
        setDisplayValue('$' + current.toLocaleString());
      } else {
        setDisplayValue(prefix + current.toLocaleString());
      }

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
  }, [end, duration, prefix]);

  useEffect(() => {
    if (startOnMount && !hasStarted) {
      start();
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [start, startOnMount, hasStarted]);

  return displayValue;
}

export function useInView(threshold: number = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}
