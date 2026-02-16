"use client";

import { Bell, Search } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        {/* search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>

        {/* notifications */}
        <button className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-600" />
        </button>

        {/* avatar */}
        <Avatar name="Admin" size="sm" />
      </div>
    </header>
  );
}
