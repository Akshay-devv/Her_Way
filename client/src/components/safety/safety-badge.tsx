import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";

type RiskLevel = "low" | "moderate" | "high" | "unknown";

interface SafetyBadgeProps {
  level: RiskLevel;
  className?: string;
  showLabel?: boolean;
}

export function SafetyBadge({ level, className, showLabel = true }: SafetyBadgeProps) {
  const config = {
    low: {
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: ShieldCheck,
      label: "Safe Area",
    },
    moderate: {
      color: "bg-amber-100 text-amber-800 border-amber-200",
      icon: ShieldAlert,
      label: "Use Caution",
    },
    high: {
      color: "bg-rose-100 text-rose-800 border-rose-200",
      icon: ShieldX,
      label: "High Risk",
    },
    unknown: {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: ShieldCheck,
      label: "Unknown Area",
    },
  };

  const { color, icon: Icon, label } = config[level] || config.unknown;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-sm backdrop-blur-sm",
      color,
      className
    )}>
      <Icon className="w-3.5 h-3.5" />
      {showLabel && <span>{label}</span>}
    </div>
  );
}
