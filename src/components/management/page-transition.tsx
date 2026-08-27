"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Brief entrance animation when switching between /management tabs —
 * children are server-rendered per route as usual; this just wraps them
 * in a motion.div keyed by pathname so switching routes re-triggers a
 * quick fade + slide-up rather than an abrupt content swap. Deliberately
 * short/no-bounce ("quick and crisp," not a showy transition).
 */
export function ManagementPageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
