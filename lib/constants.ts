import {
  LayoutDashboard,
  Users,
  Palette,
  BarChart3,
  Settings,
  Flag,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Utilisateurs", href: "/users", icon: Users },
  { label: "Oeuvres", href: "/artworks", icon: Palette },
  { label: "Signalements", href: "/reports", icon: Flag },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Paramètres", href: "/settings", icon: Settings },
];

export const COLORS = {
  primary: "#2563eb",
  primaryLight: "#3b82f6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  violet: "#8b5cf6",
  sidebar: "#0f172a",
  sidebarHover: "#1e293b",
} as const;

export const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
];
