"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  currency?: string;
}

export function AnimatedNumber({ value, currency = "USD" }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const duration = 500;
    const startTime = Date.now();
    const startValue = displayValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (value - startValue) * easeOut;
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    if (startValue !== value) {
      animate();
    }
  }, [value, displayValue]);

  return <span>{formatCurrency(displayValue, currency)}</span>;
}

