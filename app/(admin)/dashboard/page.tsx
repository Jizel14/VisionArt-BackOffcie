"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  ImagePlus,
  DollarSign,
  Activity,
  TrendingUp,
  Clock,
} from "lucide-react";
import Header from "@/components/layout/Header";
import StatCard from "@/components/cards/StatCard";
import UsersChart from "@/components/charts/UsersChart";
import GenerationsChart from "@/components/charts/GenerationsChart";
import StylePieChart from "@/components/charts/StylePieChart";
import RevenueChart from "@/components/charts/RevenueChart";
import RecentUsersTable from "@/components/tables/RecentUsersTable";
import Spinner from "@/components/ui/Spinner";
import { formatNumber, formatCurrency } from "@/lib/utils";
import type { User } from "@/types/user";

interface KPIs {
  totalUsers: number;
  newUsersToday: number;
  activeUsers24h: number;
  totalGenerations: number;
  newGenerationsToday: number;
  revenue: number;
  revenueGrowth: number;
  conversionRate: number;
  avgGenerationTime: number;
}

interface Charts {
  userGrowth: { date: string; count: number }[];
  generationsPerDay: { date: string; count: number }[];
  styleDistribution: { name: string; value: number }[];
  revenueData: { date: string; revenue: number }[];
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [charts, setCharts] = useState<Charts | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/dashboard/main").then((r) => r.json()),
      fetch("/api/admin/dashboard/charts").then((r) => r.json()),
      fetch("/api/admin/dashboard/recent").then((r) => r.json()),
    ])
      .then(([mainData, chartsData, recentData]) => {
        setKpis(mainData);
        setCharts(chartsData);
        setRecentUsers(recentData.users || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Header title="Dashboard" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 p-6"
      >
        {/* KPI cards */}
        {kpis && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Utilisateurs"
              value={formatNumber(kpis.totalUsers)}
              change={kpis.newUsersToday}
              changeSuffix="nouveaux aujourd'hui"
              icon={Users}
              iconColor="text-blue-600"
              iconBg="bg-blue-50 dark:bg-blue-900/20"
              index={0}
            />
            <StatCard
              label="Générations"
              value={formatNumber(kpis.totalGenerations)}
              change={kpis.newGenerationsToday}
              changeSuffix="aujourd'hui"
              icon={ImagePlus}
              iconColor="text-violet-600"
              iconBg="bg-violet-50 dark:bg-violet-900/20"
              index={1}
            />
            <StatCard
              label="Revenus"
              value={formatCurrency(kpis.revenue)}
              change={kpis.revenueGrowth}
              changeSuffix="vs mois dernier"
              icon={DollarSign}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50 dark:bg-emerald-900/20"
              index={2}
            />
            <StatCard
              label="Conversion"
              value={`${kpis.conversionRate}%`}
              icon={TrendingUp}
              iconColor="text-amber-600"
              iconBg="bg-amber-50 dark:bg-amber-900/20"
              index={3}
            />
            <StatCard
              label="Actifs (24h)"
              value={formatNumber(kpis.activeUsers24h)}
              icon={Activity}
              iconColor="text-rose-600"
              iconBg="bg-rose-50 dark:bg-rose-900/20"
              index={4}
            />
            <StatCard
              label="Temps moyen"
              value={`${kpis.avgGenerationTime}s`}
              icon={Clock}
              iconColor="text-cyan-600"
              iconBg="bg-cyan-50 dark:bg-cyan-900/20"
              index={5}
            />
          </div>
        )}

        {/* Charts */}
        {charts && (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <UsersChart data={charts.userGrowth} />
              <GenerationsChart data={charts.generationsPerDay} />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RevenueChart data={charts.revenueData} />
              <StylePieChart data={charts.styleDistribution} />
            </div>
          </>
        )}

        {/* Recent users */}
        <RecentUsersTable users={recentUsers} />
      </motion.div>
    </>
  );
}
