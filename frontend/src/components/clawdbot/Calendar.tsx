"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  highlightedDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function Calendar({
  selectedDate,
  onDateSelect,
  highlightedDates = [],
  minDate,
  maxDate,
  className,
}: CalendarProps) {
  const [viewDate, setViewDate] = useState(selectedDate);
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const highlightedSet = useMemo(() => {
    return new Set(highlightedDates.map(d => d.toISOString().split('T')[0]));
  }, [highlightedDates]);
  
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };
  
  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };
  
  const isHighlighted = (day: number) => {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return highlightedSet.has(dateStr);
  };
  
  const isDisabled = (day: number) => {
    const date = new Date(year, month, day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };
  
  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };
  
  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };
  
  const handleDateClick = (day: number) => {
    if (!isDisabled(day)) {
      onDateSelect(new Date(year, month, day));
    }
  };

  // Generate calendar grid
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className={cn(
      "rounded-2xl border border-[color:var(--border-light)] bg-white p-4 shadow-apple",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-muted)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 className="text-sm font-semibold text-[color:var(--text)]">
          {MONTHS[month]} {year}
        </h3>
        
        <button
          onClick={handleNextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-muted)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(day => (
          <div 
            key={day}
            className="text-center text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-quiet)] py-1"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div key={index} className="aspect-square">
            {day !== null ? (
              <button
                onClick={() => handleDateClick(day)}
                disabled={isDisabled(day)}
                className={cn(
                  "flex h-full w-full items-center justify-center rounded-lg text-sm font-medium transition-all",
                  "hover:bg-[color:var(--surface-muted)]",
                  isSelected(day) && "bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent-strong)]",
                  isToday(day) && !isSelected(day) && "bg-[color:var(--surface-muted)] text-[color:var(--accent)] font-semibold",
                  isHighlighted(day) && !isSelected(day) && !isToday(day) && "bg-green-50 text-green-700",
                  isDisabled(day) && "opacity-30 cursor-not-allowed hover:bg-transparent",
                  !isSelected(day) && !isToday(day) && !isHighlighted(day) && !isDisabled(day) && "text-[color:var(--text)]"
                )}
              >
                {day}
                {isHighlighted(day) && !isSelected(day) && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-green-500" />
                )}
              </button>
            ) : null}
          </div>
        ))}
      </div>
      
      {/* Today button */}
      <div className="mt-4 pt-4 border-t border-[color:var(--border-light)]">
        <button
          onClick={() => {
            const today = new Date();
            setViewDate(today);
            onDateSelect(today);
          }}
          className="w-full rounded-lg bg-[color:var(--surface-muted)] px-4 py-2 text-sm font-medium text-[color:var(--accent)] transition hover:bg-[color:var(--surface-strong)]"
        >
          Today
        </button>
      </div>
    </div>
  );
}

export function CalendarCompact({
  selectedDate,
  onDateSelect,
  className,
}: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  className?: string;
}) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const handlePrev = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onDateSelect(prev);
  };
  
  const handleNext = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    if (next <= new Date()) {
      onDateSelect(next);
    }
  };
  
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-xl border border-[color:var(--border-light)] bg-white px-3 py-2",
      className
    )}>
      <button
        onClick={handlePrev}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-muted)]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <span className="min-w-[120px] text-center text-sm font-medium text-[color:var(--text)]">
        {isToday ? 'Today' : formatDate(selectedDate)}
      </span>
      
      <button
        onClick={handleNext}
        disabled={isToday}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg transition",
          isToday 
            ? "text-[color:var(--text-quiet)] cursor-not-allowed" 
            : "text-[color:var(--text-muted)] hover:bg-[color:var(--surface-muted)]"
        )}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
