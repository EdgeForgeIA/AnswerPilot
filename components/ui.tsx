import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Button ───────────────────────────────────────────────────────── */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-55",
        size === "sm" && "h-8 px-3 text-[13px]",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-[15px]",
        variant === "primary" && "bg-accent text-on-accent hover:bg-accent-strong",
        variant === "secondary" &&
          "border border-line-strong bg-surface text-ink hover:border-ink-faint hover:bg-raised",
        variant === "ghost" && "text-ink-soft hover:bg-line/50 hover:text-ink",
        variant === "danger" && "bg-danger text-white hover:opacity-90",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
);
Button.displayName = "Button";

/* ── Inputs ───────────────────────────────────────────────────────── */

const fieldClasses =
  "w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(fieldClasses, className)} {...props} />
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldClasses, "leading-relaxed", className)} {...props} />
));
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-[13px] font-medium text-ink", className)} {...props} />;
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">{children}</p>;
}

/* ── Card ─────────────────────────────────────────────────────────── */

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-line bg-surface shadow-card", className)}
      {...props}
    />
  );
}

/* ── Confidence stamp ─────────────────────────────────────────────── */

export function ConfidenceStamp({ confidence }: { confidence: "high" | "medium" | "low" | null }) {
  if (!confidence) return null;
  const styles = {
    high: "text-accent bg-accent-soft",
    medium: "text-amber bg-amber-soft",
    low: "text-danger bg-danger-soft",
  } as const;
  return <span className={cn("stamp", styles[confidence])}>{confidence}</span>;
}

/* ── Status badge ─────────────────────────────────────────────────── */

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "bg-line/60 text-ink-soft" },
    answered: { label: "Drafted", cls: "bg-accent-soft text-accent" },
    approved: { label: "Approved", cls: "bg-accent text-on-accent" },
    flagged: { label: "Flagged", cls: "bg-amber-soft text-amber" },
    in_review: { label: "In review", cls: "bg-amber-soft text-amber" },
    completed: { label: "Completed", cls: "bg-accent-soft text-accent" },
  };
  const item = map[status] ?? { label: status, cls: "bg-line/60 text-ink-soft" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        item.cls
      )}
    >
      {item.label}
    </span>
  );
}

/* ── Misc ─────────────────────────────────────────────────────────── */

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-ink-faint", className)} aria-label="Loading" />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong px-6 py-14 text-center">
      {icon && <div className="mb-3 text-ink-faint">{icon}</div>}
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
