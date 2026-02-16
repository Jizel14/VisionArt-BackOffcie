"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Sparkles,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Tooltip from "@/components/ui/Tooltip";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-800 bg-slate-950"
    >
      {/* logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="whitespace-nowrap text-lg font-bold text-white"
            >
              VisionArt
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          const link = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-blue-600/10 text-blue-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  active
                    ? "text-blue-400"
                    : "text-slate-500 group-hover:text-white"
                )}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 h-8 w-[3px] rounded-r-full bg-blue-500"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          );

          return collapsed ? (
            <Tooltip key={item.href} content={item.label} side="bottom">
              {link}
            </Tooltip>
          ) : (
            link
          );
        })}
      </nav>

      {/* bottom */}
      <div className="border-t border-slate-800 px-3 py-3 space-y-1">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-5 w-5 shrink-0 text-slate-500" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="whitespace-nowrap"
              >
                Déconnexion
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <button
          onClick={onToggle}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-slate-500 transition-colors hover:text-white"
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5" />
              <span className="text-xs">Réduire</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
