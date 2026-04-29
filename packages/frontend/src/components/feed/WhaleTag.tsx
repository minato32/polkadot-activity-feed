import type { LabelCategory } from "@polkadot-feed/shared";
import { cn } from "@/lib/utils";

interface WhaleTagProps {
  label: string;
  category: LabelCategory;
  className?: string;
}

const CATEGORY_STYLES: Record<LabelCategory, string> = {
  exchange: "bg-orange-900/60 text-orange-300 border-orange-700/50",
  treasury: "bg-blue-900/60 text-blue-300 border-blue-700/50",
  validator: "bg-purple-900/60 text-purple-300 border-purple-700/50",
  fund: "bg-green-900/60 text-green-300 border-green-700/50",
  bridge: "bg-cyan-900/60 text-cyan-300 border-cyan-700/50",
  team: "bg-pink-900/60 text-pink-300 border-pink-700/50",
};

const CATEGORY_ICONS: Record<LabelCategory, string> = {
  exchange: "⇄",
  treasury: "◈",
  validator: "✦",
  fund: "◉",
  bridge: "⬡",
  team: "◆",
};

export function WhaleTag({ label, category, className }: WhaleTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium",
        CATEGORY_STYLES[category],
        className,
      )}
      title={`Category: ${category}`}
      aria-label={`${label} (${category})`}
    >
      <span aria-hidden="true">{CATEGORY_ICONS[category]}</span>
      {label}
    </span>
  );
}
