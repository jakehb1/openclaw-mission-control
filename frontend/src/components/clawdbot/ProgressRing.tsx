"use client";

import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

const colorMap = {
  blue: { stroke: '#0071e3', bg: 'rgba(0, 113, 227, 0.1)' },
  green: { stroke: '#34c759', bg: 'rgba(52, 199, 89, 0.1)' },
  orange: { stroke: '#ff9500', bg: 'rgba(255, 149, 0, 0.1)' },
  purple: { stroke: '#af52de', bg: 'rgba(175, 82, 222, 0.1)' },
  red: { stroke: '#ff3b30', bg: 'rgba(255, 59, 48, 0.1)' },
};

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
  children,
  showPercentage = true,
  color = 'blue',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;
  const { stroke, bg } = colorMap[color];

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bg}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children ? (
          children
        ) : showPercentage ? (
          <>
            <span className="text-2xl font-semibold text-[color:var(--text)]">
              {Math.round(progress)}%
            </span>
            <span className="text-xs text-[color:var(--text-quiet)]">
              complete
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function ProgressBar({
  progress,
  height = 8,
  className,
  showLabel = false,
  color = 'blue',
}: {
  progress: number;
  height?: number;
  className?: string;
  showLabel?: boolean;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}) {
  const { stroke, bg } = colorMap[color];
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-1.5">
          <span className="text-xs font-medium text-[color:var(--text-muted)]">Progress</span>
          <span className="text-xs font-medium text-[color:var(--text)]">{Math.round(progress)}%</span>
        </div>
      )}
      <div 
        className="w-full rounded-full overflow-hidden"
        style={{ height, backgroundColor: bg }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `${clampedProgress}%`,
            backgroundColor: stroke,
          }}
        />
      </div>
    </div>
  );
}

export function MiniProgressRing({
  progress,
  size = 32,
  strokeWidth = 3,
  color = 'green',
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;
  const { stroke, bg } = colorMap[color];

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={bg}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-300"
      />
    </svg>
  );
}
