"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({
  children,
  className,
  hover = false,
}: CardProps) {
  const Comp = hover ? motion.div : "div";
  const hoverProps = hover
    ? { whileHover: { y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" } }
    : {};

  return (
    <Comp
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow dark:border-slate-800 dark:bg-slate-900",
        className
      )}
      {...hoverProps}
    >
      {children}
    </Comp>
  );
}
