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

export function ResponseChart({ checks }: ResponseChartProps) {
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
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 14%)" />
        <XAxis
          dataKey="time"
          stroke="hsl(240 5% 50%)"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          stroke="hsl(240 5% 50%)"
          fontSize={12}
          tickLine={false}
          tickFormatter={(v) => `${v}ms`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(240 6% 4%)",
            border: "1px solid hsl(240 5% 14%)",
            borderRadius: "8px",
            color: "hsl(240 6% 90%)",
          }}
          formatter={(value) => [`${value}ms`, "Response Time"]}
        />
        <Line
          type="monotone"
          dataKey="responseMs"
          stroke="hsl(151 100% 45%)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "hsl(151 100% 45%)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
