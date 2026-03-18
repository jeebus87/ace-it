"use client";

import { useMemo } from "react";

interface ActivityData {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  data: ActivityData[];
  title?: string;
}

const getColor = (count: number): string => {
  if (count === 0) return "bg-[hsl(var(--secondary))]";
  if (count === 1) return "bg-green-900/50";
  if (count === 2) return "bg-green-700/70";
  if (count === 3) return "bg-green-500/80";
  return "bg-green-400";
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ActivityHeatmap({ data, title = "Activity" }: ActivityHeatmapProps) {
  const { weeks, monthLabels, totalActivity } = useMemo(() => {
    // Group data into weeks
    const weeks: ActivityData[][] = [];
    let currentWeek: ActivityData[] = [];

    // Get the day of week for the first date to properly align
    const firstDate = new Date(data[0]?.date || new Date());
    const startDayOfWeek = firstDate.getDay();

    // Add empty cells for alignment
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

    // Push remaining days
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    // Generate month labels
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
    <div className="p-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[hsl(var(--foreground))]">{title}</h3>
        <span className="text-sm text-[hsl(var(--muted-foreground))]">
          {totalActivity} quizzes in the last year
        </span>
      </div>

      {/* Month labels */}
      <div className="flex mb-1 ml-8">
        {monthLabels.map(({ label, weekIndex }, i) => (
          <span
            key={i}
            className="text-xs text-[hsl(var(--muted-foreground))]"
            style={{
              position: "relative",
              left: `${weekIndex * 14}px`,
              marginRight: i < monthLabels.length - 1 ? "0" : "auto",
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {DAYS.map((day, i) => (
            <span
              key={day}
              className="text-xs text-[hsl(var(--muted-foreground))] h-3 leading-3"
              style={{ visibility: i % 2 === 1 ? "visible" : "hidden" }}
            >
              {day}
            </span>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-[3px] overflow-x-auto">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`w-3 h-3 rounded-sm ${
                    day.count === -1
                      ? "bg-transparent"
                      : getColor(day.count)
                  } transition-colors hover:ring-1 hover:ring-[hsl(var(--primary))]`}
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
      <div className="flex items-center justify-end gap-1 mt-3">
        <span className="text-xs text-[hsl(var(--muted-foreground))] mr-1">Less</span>
        <div className={`w-3 h-3 rounded-sm ${getColor(0)}`} />
        <div className={`w-3 h-3 rounded-sm ${getColor(1)}`} />
        <div className={`w-3 h-3 rounded-sm ${getColor(2)}`} />
        <div className={`w-3 h-3 rounded-sm ${getColor(3)}`} />
        <div className={`w-3 h-3 rounded-sm ${getColor(4)}`} />
        <span className="text-xs text-[hsl(var(--muted-foreground))] ml-1">More</span>
      </div>
    </div>
  );
}
