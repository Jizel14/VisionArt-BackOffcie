"use client";

import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

const bgColors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-teal-500",
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export default function Avatar({ name, size = "md", className }: AvatarProps) {
  const bg = bgColors[hashStr(name) % bgColors.length];
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white",
        sizeMap[size],
        bg,
        className
      )}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
