"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <motion.main
        initial={false}
        animate={{ marginLeft: collapsed ? 72 : 260 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="min-h-screen"
      >
        {children}
      </motion.main>
    </div>
  );
}
