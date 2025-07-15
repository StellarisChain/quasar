import React, { useState, useRef, useEffect } from 'react';

export const MiniChart = ({ data, color, positive }: { data: number[]; color: string; positive: boolean }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  const width = 240;
  const height = 40;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');


  const polylineRef = useRef<SVGPolylineElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    setDrawn(false);
    let observer: IntersectionObserver | null = null;
    const el = containerRef.current;
    if (el) {
      observer = new window.IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setDrawn(true);
            observer && observer.disconnect();
          }
        },
        { threshold: 0.3 }
      );
      observer.observe(el);
    }
    return () => {
      if (observer) observer.disconnect();
    };
  }, [data]);

  useEffect(() => {
    if (!polylineRef.current) return;
    const poly = polylineRef.current;
    const length = poly.getTotalLength();
    poly.style.transition = 'none';
    poly.style.strokeDasharray = String(length);
    poly.style.strokeDashoffset = String(length);
    if (drawn) {
      setTimeout(() => {
        poly.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)';
        poly.style.strokeDashoffset = '0';
      }, 10);
    }
  }, [drawn, data]);

  return (
    <div className="mini-chart" ref={containerRef}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.1 }} />
          </linearGradient>
        </defs>
        <polyline
          ref={polylineRef}
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
        />
        <polygon
          fill={`url(#gradient-${color})`}
          points={`0,${height} ${points} ${width},${height}`}
        />
      </svg>
    </div>
  );
};
