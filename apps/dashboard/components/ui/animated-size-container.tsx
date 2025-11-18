"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AnimatedSizeContainerProps {
  children: React.ReactNode;
  className?: string;
  width?: boolean;
  height?: boolean;
}

export function AnimatedSizeContainer({
  children,
  className,
  width = false,
  height = false,
}: AnimatedSizeContainerProps) {
  return (
    <motion.div
      className={cn(className)}
      animate={{
        width: width ? "auto" : undefined,
        height: height ? "auto" : undefined,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
