import { Star } from "lucide-react";

export default function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 gap-0.5",
    md: "text-sm px-2 py-1 gap-1",
    lg: "text-base px-3 py-1.5 gap-1.5",
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-md bg-primary text-primary-foreground ${sizeClasses[size]}`}>
      <Star className={size === "sm" ? "h-3 w-3" : size === "md" ? "h-3.5 w-3.5" : "h-4 w-4"} fill="currentColor" />
      {score.toFixed(1)}
    </span>
  );
}
