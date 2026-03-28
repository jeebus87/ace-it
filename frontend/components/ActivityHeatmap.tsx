"use client";

import { useMemo } from "react";
import { Calendar } from "lucide-react";

interface ActivityData {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  data: ActivityData[];
  title?: string;
}

const getColor = (count: number): string => {
  if (count === 0) return "bg-[hsl(var(--bg-deep))] border-[hsl(var(--border))]";
  if (count === 1) return "bg-[hsl(var(--neon-green))]/20 border-[hsl(var(--neon-green))]/30";
  if (count === 2) return "bg-[hsl(var(--neon-green))]/40 border-[hsl(var(--neon-green))]/50";
  if (count === 3) return "bg-[hsl(var(--neon-green))]/60 border-[hsl(var(--neon-green))]/70";
  return "bg-[hsl(var(--neon-green))] border-[hsl(var(--neon-green))]";
};

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function ActivityHeatmap({ data, title = "ACTIVITY" }: ActivityHeatmapProps) {
  const { weeks, monthLabels, totalActivity } = useMemo(() => {
    const weeks: ActivityData[][] = [];
    let currentWeek: ActivityData[] = [];

    const firstDate = new Date(data[0]?.date || new Date());
    const startDayOfWeek = firstDate.getDay();

    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({ date: "", count: -1 });
    }

    data.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    const monthLabels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const validDay = week.find((d) => d.date);
      if (validDay && validDay.date) {
        const date = new Date(validDay.date);
        const month = date.getMonth();
        if (month !== lastMonth) {
          monthLabels.push({ label: MONTHS[month], weekIndex });
          lastMonth = month;
        }
      }
    });

    const totalActivity = data.reduce((sum, d) => sum + d.count, 0);

    return { weeks, monthLabels, totalActivity };
  }, [data]);

  return (
    <div className={`
      relative
      p-4
      bg-[hsl(var(--bg-surface))]
      border-2 border-[hsl(var(--neon-green))]
    `}>
      {/* Pixel corners */}
      <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2 border-[hsl(var(--neon-green))]" />
      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2 border-[hsl(var(--neon-green))]" />
      <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2 border-[hsl(var(--neon-green))]" />
      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2 border-[hsl(var(--neon-green))]" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm text-[hsl(var(--neon-green))] flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {title}
        </h3>
        <span className="font-accent text-xs text-[hsl(var(--text-muted))] tracking-wider">
          {totalActivity} QUIZZES / YEAR
        </span>
      </div>

      {/* Month labels */}
      <div className="flex mb-1 ml-6 overflow-hidden">
        {monthLabels.map(({ label, weekIndex }, i) => (
          <span
            key={i}
            className="font-display text-[8px] text-[hsl(var(--text-muted))]"
            style={{
              position: "relative",
              left: `${weekIndex * 11}px`,
              marginRight: i < monthLabels.length - 1 ? "0" : "auto",
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {DAYS.map((day, i) => (
            <span
              key={`${day}-${i}`}
              className="font-display text-[8px] text-[hsl(var(--text-muted))] h-[10px] leading-[10px] w-4 text-right"
              style={{ visibility: i % 2 === 1 ? "visible" : "hidden" }}
            >
              {day}
            </span>
          ))}
        </div>

        {/* Heatmap grid - Pixel art squares */}
        <div className="flex gap-[2px] overflow-x-auto pb-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[2px]">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`
                    w-[10px] h-[10px]
                    border
                    ${day.count === -1
                      ? "bg-transparent border-transparent"
                      : getColor(day.count)
                    }
                    transition-all duration-200
                    hover:scale-150 hover:z-10
                    ${day.count > 0 ? "hover:shadow-[0_0_8px_hsl(var(--neon-green))]" : ""}
                  `}
                  title={
                    day.date
                      ? `${day.date}: ${day.count} quiz${day.count !== 1 ? "zes" : ""}`
                      : ""
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3">
        <span className="font-accent text-[10px] text-[hsl(var(--text-muted))] tracking-wider">LESS</span>
        <div className="flex gap-[2px]">
          <div className={`w-[10px] h-[10px] border ${getColor(0)}`} />
          <div className={`w-[10px] h-[10px] border ${getColor(1)}`} />
          <div className={`w-[10px] h-[10px] border ${getColor(2)}`} />
          <div className={`w-[10px] h-[10px] border ${getColor(3)}`} />
          <div className={`w-[10px] h-[10px] border ${getColor(4)}`} />
        </div>
        <span className="font-accent text-[10px] text-[hsl(var(--text-muted))] tracking-wider">MORE</span>
      </div>
    </div>
  );
}
