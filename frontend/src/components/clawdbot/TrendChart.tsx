"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface TrendChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  showLabels?: boolean;
  showValues?: boolean;
  animate?: boolean;
  className?: string;
}

const colorMap = {
  blue: { fill: 'rgba(0, 113, 227, 0.1)', stroke: '#0071e3', dot: '#0071e3' },
  green: { fill: 'rgba(52, 199, 89, 0.1)', stroke: '#34c759', dot: '#34c759' },
  purple: { fill: 'rgba(175, 82, 222, 0.1)', stroke: '#af52de', dot: '#af52de' },
  orange: { fill: 'rgba(255, 149, 0, 0.1)', stroke: '#ff9500', dot: '#ff9500' },
  red: { fill: 'rgba(255, 59, 48, 0.1)', stroke: '#ff3b30', dot: '#ff3b30' },
};

export function TrendChart({
  data,
  height = 120,
  color = 'blue',
  showLabels = true,
  showValues = false,
  animate = true,
  className,
}: TrendChartProps) {
  const colors = colorMap[color];
  
  const { points, areaPath, linePath, maxValue, minValue } = useMemo(() => {
    if (data.length === 0) return { points: [], areaPath: '', linePath: '', maxValue: 0, minValue: 0 };
    
    const values = data.map(d => d.value);
    const max = Math.max(...values) * 1.1; // Add 10% padding
    const min = Math.min(0, Math.min(...values));
    const range = max - min || 1;
    
    const padding = 20;
    const chartWidth = 100; // percentage
    const chartHeight = height - (showLabels ? 30 : 10);
    
    const pts = data.map((d, i) => {
      const x = padding + (i / (data.length - 1 || 1)) * (chartWidth - padding * 2);
      const y = chartHeight - ((d.value - min) / range) * (chartHeight - 10);
      return { x, y, value: d.value, label: d.label };
    });
    
    // Create SVG path for line
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    // Create SVG path for filled area
    const area = `${line} L ${pts[pts.length - 1]?.x ?? padding} ${chartHeight} L ${padding} ${chartHeight} Z`;
    
    return { points: pts, areaPath: area, linePath: line, maxValue: max, minValue: min };
  }, [data, height, showLabels]);

  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center text-sm text-[color:var(--text-quiet)]", className)} style={{ height }}>
        No data available
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} style={{ height }}>
      <svg 
        viewBox={`0 0 100 ${height}`} 
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {/* Area fill */}
        <path
          d={areaPath}
          fill={colors.fill}
          className={animate ? "animate-fade-in" : ""}
        />
        
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className={animate ? "animate-fade-in" : ""}
        />
        
        {/* Dots */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="white"
            stroke={colors.dot}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            className={animate ? "animate-fade-in" : ""}
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </svg>
      
      {/* Labels */}
      {showLabels && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
          {data.map((d, i) => (
            <span 
              key={i} 
              className="text-[10px] text-[color:var(--text-quiet)] truncate"
              style={{ maxWidth: `${100 / data.length}%` }}
            >
              {d.label}
            </span>
          ))}
        </div>
      )}
      
      {/* Values on hover */}
      {showValues && (
        <div className="absolute top-0 left-0 right-0 flex justify-between px-4">
          {data.map((d, i) => (
            <span 
              key={i} 
              className="text-[10px] font-medium text-[color:var(--text)]"
              style={{ maxWidth: `${100 / data.length}%` }}
            >
              {d.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function BarChart({
  data,
  height = 200,
  color = 'blue',
  showLabels = true,
  className,
}: TrendChartProps) {
  const colors = colorMap[color];
  
  const maxValue = useMemo(() => {
    if (data.length === 0) return 1;
    return Math.max(...data.map(d => d.value)) * 1.1;
  }, [data]);

  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center text-sm text-[color:var(--text-quiet)]", className)} style={{ height }}>
        No data available
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)} style={{ height }}>
      <div className="flex-1 flex items-end gap-1">
        {data.map((d, i) => (
          <div 
            key={i}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <span className="text-[10px] font-medium text-[color:var(--text)]">
              {d.value}
            </span>
            <div 
              className="w-full rounded-t-md transition-all duration-500"
              style={{ 
                height: `${(d.value / maxValue) * 100}%`,
                backgroundColor: colors.stroke,
                minHeight: '4px',
              }}
            />
          </div>
        ))}
      </div>
      
      {showLabels && (
        <div className="flex gap-1 pt-2 border-t border-[color:var(--border-light)] mt-2">
          {data.map((d, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-[10px] text-[color:var(--text-quiet)] truncate block">
                {d.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SparkLine({
  values,
  width = 80,
  height = 24,
  color = 'blue',
  className,
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  className?: string;
}) {
  const colors = colorMap[color];
  
  const path = useMemo(() => {
    if (values.length < 2) return '';
    
    const max = Math.max(...values) || 1;
    const min = Math.min(0, Math.min(...values));
    const range = max - min || 1;
    
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    });
    
    return points.join(' ');
  }, [values, width, height]);

  return (
    <svg width={width} height={height} className={className}>
      <path
        d={path}
        fill="none"
        stroke={colors.stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ComparisonBadge({
  value,
  label,
  className,
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
      isPositive && "bg-green-50 text-green-700",
      isNegative && "bg-red-50 text-red-700",
      isNeutral && "bg-gray-100 text-gray-600",
      className
    )}>
      {isPositive && <span>↑</span>}
      {isNegative && <span>↓</span>}
      {Math.abs(value)}%
      {label && <span className="text-[color:var(--text-quiet)] ml-0.5">{label}</span>}
    </span>
  );
}
