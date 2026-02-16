"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import Card from "@/components/ui/Card";
import { CHART_COLORS } from "@/lib/constants";

interface StylePieChartProps {
  data: { name: string; value: number }[];
}

export default function StylePieChart({ data }: StylePieChartProps) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
        Répartition par style
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: "12px",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
