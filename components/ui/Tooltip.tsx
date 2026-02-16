"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "bottom";
}

export default function Tooltip({
  content,
  children,
  side = "top",
}: TooltipProps) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className={cn(
            "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1 text-xs text-white shadow-lg dark:bg-slate-700",
            side === "top" && "bottom-full mb-2",
            side === "bottom" && "top-full mt-2"
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
