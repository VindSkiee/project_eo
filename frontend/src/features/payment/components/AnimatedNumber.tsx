import { useEffect, useRef } from "react";

interface AnimatedNumberProps {
  value: number;
  formatter: (val: number) => string;
}

export function AnimatedNumber({ value, formatter }: AnimatedNumberProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;
    
    // Jika tidak ada perubahan, tidak perlu animasi
    if (startValue === endValue) return;

    const duration = 400; // Durasi animasi dalam milidetik (0.4 detik)
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      // Hitung progress dari 0.0 sampai 1.0
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Fungsi Easing (ease-out cubic) agar pergerakan melambat di akhir (smooth)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      // Hitung angka saat ini berdasarkan progress
      const currentValue = Math.round(startValue + (endValue - startValue) * easeProgress);

      // Manipulasi DOM LANGSUNG (Bypass React render cycle -> Super Ringan!)
      if (elementRef.current) {
        elementRef.current.textContent = formatter(currentValue);
      }

      // Lanjut ke frame berikutnya jika belum selesai
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endValue; // Update prev value ketika selesai
      }
    };

    animationFrame = requestAnimationFrame(animate);

    // Cleanup untuk mencegah memory leak jika komponen di-unmount
    return () => cancelAnimationFrame(animationFrame);
  }, [value, formatter]);

  // Render awal, direfensikan oleh useRef
  return <span ref={elementRef}>{formatter(value)}</span>;
}