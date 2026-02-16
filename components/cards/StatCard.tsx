"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;        // percentage
  changeSuffix?: string;  // e.g. "aujourd'hui"
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  index?: number;
}

export default function StatCard({
  label,
  value,
  change,
  changeSuffix,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBg = "bg-blue-50 dark:bg-blue-900/20",
  index = 0,
}: StatCardProps) {
  const positive = change !== undefined && change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            iconBg
          )}
        >
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>

      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {positive ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          )}
          <span
            className={cn(
              "font-medium",
              positive ? "text-emerald-600" : "text-red-600"
            )}
          >
            {positive ? "+" : ""}
            {change}%
          </span>
          {changeSuffix && (
            <span className="text-slate-400">{changeSuffix}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
