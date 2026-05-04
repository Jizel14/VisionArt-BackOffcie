"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import ChatDrawer from "@/components/ui/ChatDrawer";
import { cn } from "@/lib/utils";

export default function FloatingChat() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ChatDrawer open={open} onClose={() => setOpen(false)} />
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg",
          "bg-[#6C63FF] text-white",
          "hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus-visible:ring-offset-2"
        )}
        aria-label="Open Admin Copilot"
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>
    </>
  );
}

