import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: "default" | "outline";
}

export function Badge({ children, className, style, variant = "default" }: BadgeProps) {
  return (
    <span
      style={style}
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        variant === "default" && "bg-gray-700 text-gray-200",
        variant === "outline" && "border border-gray-600 text-gray-300",
        className,
      )}
    >
      {children}
    </span>
  );
}
