"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { CHART_COLORS } from "@/lib/constants";
import {
  mockRetention,
  mockPopularPrompts,
  mockModelUsage,
  mockHourlyActivity,
  mockRevenueByProduct,
  mockGenerationsPerDay,
  mockRevenueData,
} from "@/lib/mock-data";

const PERIODS = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d");

  const sliceData = <T,>(arr: T[]): T[] => {
    if (period === "7d") return arr.slice(-7);
    if (period === "90d") return arr;
    return arr.slice(-30);
  };

  return (
    <>
      <Header title="Analytics" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8 p-6"
      >
        {/* period selector */}
        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "primary" : "outline"}
              size="sm"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {/* Section 1: General */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">
            Croissance & Rétention
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Retention chart */}
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Rétention utilisateurs
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={mockRetention}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(v) => [`${v}%`, "Rétention"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* revenue trend */}
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tendance des revenus
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={sliceData(mockRevenueData)}>
                  <defs>
                    <linearGradient
                      id="anaRevGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#10b981"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor="#10b981"
                        stopOpacity={0}
                      />
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
                      fontSize: "12px",
                    }}
                    formatter={(v) => [`${v}€`, "Revenus"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#anaRevGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </section>

        {/* Section 2: IA & Generations */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">
            IA & Générations
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* generations over time */}
            <Card className="p-5 lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Générations par jour
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={sliceData(mockGenerationsPerDay)}>
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
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    name="Générations"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* model usage pie */}
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Modèles utilisés
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={mockModelUsage}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="usage"
                    nameKey="model"
                  >
                    {mockModelUsage.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`${v}%`, "Utilisation"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px" }}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </section>

        {/* Section 3: Activity & prompts */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">
            Activité & Tendances
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* hourly activity */}
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Activité par heure
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={mockHourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
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
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="generations"
                    fill="#06b6d4"
                    radius={[3, 3, 0, 0]}
                    name="Générations"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* popular prompts */}
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Prompts les plus populaires
              </h3>
              <div className="space-y-3">
                {mockPopularPrompts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm text-slate-700 dark:text-slate-300">
                        {p.prompt}
                      </p>
                      <div className="mt-1 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-2 rounded-full bg-blue-500 transition-all"
                          style={{
                            width: `${(p.count / mockPopularPrompts[0].count) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-slate-500">
                      {p.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Section 4: Revenue by product */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">
            Monétisation
          </h2>
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Revenus par produit
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockRevenueByProduct} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}€`}
                />
                <YAxis
                  type="category"
                  dataKey="product"
                  width={140}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [`${Number(v).toLocaleString()}€`, "Revenus"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                  name="Revenus"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </section>
      </motion.div>
    </>
  );
}
