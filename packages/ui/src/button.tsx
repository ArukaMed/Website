import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "gold" | "ghost" | "line";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 rounded-brand-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  const variants = {
    primary: "bg-brand-primary text-white hover:brightness-110",
    gold: "bg-brand-accent text-brand-deep hover:brightness-105",
    ghost: "bg-transparent text-brand-text border border-line hover:border-brand-accent",
    line: "bg-transparent text-white border border-white/40 hover:border-brand-accent-light hover:text-brand-accent-light",
  };

  const sizes = {
    sm: "min-h-[40px] px-3.5 py-1.5 text-[14px]",
    md: "min-h-[48px] px-5 py-2.5 text-[15px]",
    lg: "min-h-[56px] px-6 py-3 text-[16px]",
  };

  return (
    <button
      className={twMerge(clsx(base, variants[variant], sizes[size], className))}
      {...props}
    >
      {children}
    </button>
  );
}
