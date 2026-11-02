"use client";

import { useFormStatus } from "react-dom";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "soft";
};

// A rounded button. Inside a <form>, it shows "…" while the form is submitting.
export function Button({ variant = "primary", className = "", children, ...props }: Props) {
  const { pending } = useFormStatus();
  const styles =
    variant === "primary"
      ? "bg-accent text-accent-foreground"
      : "bg-surface text-foreground shadow-sm";

  return (
    <button
      {...props}
      disabled={pending || props.disabled}
      className={`h-12 w-full rounded-full px-5 font-medium transition active:scale-[0.98] disabled:opacity-60 ${styles} ${className}`}
    >
      {pending ? "One moment…" : children}
    </button>
  );
}
