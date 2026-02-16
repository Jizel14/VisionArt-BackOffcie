"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import Card from "@/components/ui/Card";

interface GenerationsChartProps {
  data: { date: string; count: number }[];
}

export default function GenerationsChart({ data }: GenerationsChartProps) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
        Générations IA par jour
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => v.slice(5)}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: "12px",
            }}
          />
          <Bar
            dataKey="count"
            fill="#8b5cf6"
            radius={[4, 4, 0, 0]}
            name="Générations"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
