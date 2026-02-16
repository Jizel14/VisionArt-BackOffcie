"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import Card from "@/components/ui/Card";

interface RevenueChartProps {
  data: { date: string; revenue: number }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
        Revenus (30 jours)
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            tickFormatter={(v: number) => `${v}€`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: "12px",
            }}
            formatter={(v) => [`${v}€`, "Revenus"]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#revGrad)"
            name="Revenus"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
