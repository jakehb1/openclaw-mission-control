"use client";

import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray';
  className?: string;
  onClick?: () => void;
}

const colorStyles = {
  blue: {
    icon: 'bg-blue-50 text-blue-600',
    trend: 'text-blue-600',
  },
  green: {
    icon: 'bg-green-50 text-green-600',
    trend: 'text-green-600',
  },
  orange: {
    icon: 'bg-orange-50 text-orange-600',
    trend: 'text-orange-600',
  },
  purple: {
    icon: 'bg-purple-50 text-purple-600',
    trend: 'text-purple-600',
  },
  red: {
    icon: 'bg-red-50 text-red-600',
    trend: 'text-red-600',
  },
  gray: {
    icon: 'bg-gray-100 text-gray-600',
    trend: 'text-gray-600',
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  className,
  onClick,
}: StatsCardProps) {
  const styles = colorStyles[color];
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      onClick={onClick}
      className={cn(
        "relative rounded-2xl border border-[color:var(--border-light)] bg-white p-5",
        "transition-all duration-300 ease-apple",
        onClick && "cursor-pointer hover:border-[color:var(--accent)] hover:shadow-apple hover:-translate-y-0.5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--text-quiet)]">
            {title}
          </p>
          <p className="text-3xl font-semibold tracking-tight text-[color:var(--text)]">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-[color:var(--text-muted)]">
              {subtitle}
            </p>
          )}
        </div>
        
        {icon && (
          <div className={cn("rounded-xl p-2.5", styles.icon)}>
            {icon}
          </div>
        )}
      </div>
      
      {trend && (
        <div className="mt-3 pt-3 border-t border-[color:var(--border-light)]">
          <div className="flex items-center gap-1.5">
            {trend.isPositive !== undefined && (
              <span className={cn(
                "text-sm font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}>
                {trend.isPositive ? "↑" : "↓"}
              </span>
            )}
            <span className={cn("text-sm font-medium", styles.trend)}>
              {trend.value > 0 ? `+${trend.value}` : trend.value}%
            </span>
            {trend.label && (
              <span className="text-xs text-[color:var(--text-quiet)]">
                {trend.label}
              </span>
            )}
          </div>
        </div>
      )}
    </Component>
  );
}

export function StatsCardMini({
  label,
  value,
  icon,
  color = 'blue',
  className,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray';
  className?: string;
}) {
  const styles = colorStyles[color];
  
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl border border-[color:var(--border-light)] bg-white px-4 py-3",
      className
    )}>
      {icon && (
        <div className={cn("rounded-lg p-2", styles.icon)}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-xl font-semibold text-[color:var(--text)]">{value}</p>
        <p className="text-xs text-[color:var(--text-quiet)]">{label}</p>
      </div>
    </div>
  );
}

export function StatsRow({ 
  stats 
}: { 
  stats: Array<{ label: string; value: string | number; color?: StatsCardProps['color'] }> 
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:flex md:divide-x md:divide-[color:var(--border-light)] md:gap-0">
      {stats.map((stat, index) => (
        <div 
          key={stat.label}
          className={cn(
            "text-center py-3 md:px-6",
            "rounded-xl border border-[color:var(--border-light)] bg-white md:rounded-none md:border-0",
            index === 0 && "md:rounded-l-xl md:border-l",
            index === stats.length - 1 && "md:rounded-r-xl md:border-r"
          )}
        >
          <p className="text-2xl font-semibold text-[color:var(--text)]">
            {stat.value}
          </p>
          <p className="text-xs text-[color:var(--text-quiet)] uppercase tracking-wide mt-1">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
