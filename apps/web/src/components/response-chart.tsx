import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { CheckResult } from "@uptimecrow/shared";

interface ResponseChartProps {
  checks: CheckResult[];
}

/**
 * Resolves a themed HSL token (e.g. "--brand") to a concrete `hsl(...)` string.
 * Recharts renders to SVG attributes that can't consume Tailwind classes, so we
 * read the CSS variable off :root and re-read it when the theme (class on <html>)
 * changes — keeping the chart on-palette in both light and dark themes.
 */
function useThemeColor(variable: string, fallback: string) {
  const [color, setColor] = useState(fallback);
  useEffect(() => {
    const read = () => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim();
      if (raw) setColor(`hsl(${raw})`);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [variable]);
  return color;
}

export function ResponseChart({ checks }: ResponseChartProps) {
  const brand = useThemeColor("--brand", "hsl(142 62% 50%)");
  const border = useThemeColor("--border", "hsl(240 5% 14%)");
  const muted = useThemeColor("--muted-foreground", "hsl(240 5% 50%)");
  const card = useThemeColor("--card", "hsl(240 6% 4%)");
  const foreground = useThemeColor("--foreground", "hsl(240 6% 90%)");

  const data = [...checks]
    .reverse()
    .map((c) => ({
      time: new Date(c.checkedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      responseMs: c.responseMs ?? 0,
      status: c.status,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={border} />
        <XAxis
          dataKey="time"
          stroke={muted}
          fontSize={11}
          fontFamily='"IBM Plex Mono", monospace'
          tickLine={false}
        />
        <YAxis
          stroke={muted}
          fontSize={11}
          fontFamily='"IBM Plex Mono", monospace'
          tickLine={false}
          tickFormatter={(v) => `${v}ms`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: card,
            border: `1px solid ${border}`,
            borderRadius: "8px",
            color: foreground,
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: "12px",
          }}
          formatter={(value) => [`${value}ms`, "Response Time"]}
        />
        <Line
          type="monotone"
          dataKey="responseMs"
          stroke={brand}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: brand }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
