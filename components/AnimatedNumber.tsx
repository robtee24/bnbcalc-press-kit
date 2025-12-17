'use client';

import { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number | null;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number; // in milliseconds
}

export default function AnimatedNumber({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 2000,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value === null || value === undefined) {
      setDisplayValue(0);
      return;
    }

    setIsAnimating(true);
    const startValue = 0;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOut;

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  if (value === null || value === undefined) {
    return <span>—</span>;
  }

  // Format the number with commas and specified decimals
  let formattedValue: string;
  if (decimals > 0) {
    // For numbers with decimals, round first then format with commas and decimals
    const rounded = parseFloat(displayValue.toFixed(decimals));
    formattedValue = rounded.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } else {
    // For whole numbers, round and format with commas (no decimals)
    const rounded = Math.round(displayValue);
    formattedValue = rounded.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  return (
    <span>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

