import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function Badge({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold tracking-wide border border-line bg-surface text-brand-text",
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
}
