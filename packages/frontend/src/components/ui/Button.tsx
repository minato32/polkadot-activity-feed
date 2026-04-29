import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  className,
  variant = "secondary",
  size = "md",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "px-3 py-1 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        variant === "primary" && "bg-pink-600 text-white hover:bg-pink-700",
        variant === "secondary" && "bg-gray-700 text-gray-200 hover:bg-gray-600",
        variant === "ghost" && "text-gray-400 hover:bg-gray-800 hover:text-gray-100",
        variant === "outline" && "border border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-800",
        className,
      )}
    >
      {children}
    </button>
  );
}
