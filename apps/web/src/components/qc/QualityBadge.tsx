"use client";

import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface QualityBadgeProps {
  score: number;
  showIcon?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  trend?: "up" | "down" | "stable";
}

export default function QualityBadge({
  score,
  showIcon = true,
  showLabel = true,
  size = "md",
  trend,
}: QualityBadgeProps) {
  const getScoreConfig = (score: number) => {
    if (score >= 90) {
      return {
        color: "bg-green-500",
        textColor: "text-white",
        label: "Excellent",
        icon: "🌟",
      };
    }
    if (score >= 75) {
      return {
        color: "bg-blue-500",
        textColor: "text-white",
        label: "Good",
        icon: "👍",
      };
    }
    if (score >= 60) {
      return {
        color: "bg-yellow-500",
        textColor: "text-white",
        label: "Fair",
        icon: "⚠️",
      };
    }
    return {
      color: "bg-red-500",
      textColor: "text-white",
      label: "Poor",
      icon: "❌",
    };
  };

  const config = getScoreConfig(score);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const getTrendIcon = () => {
    if (!trend) return null;

    const iconClass = iconSizes[size];

    if (trend === "up") {
      return <TrendingUp className={`${iconClass} ml-1`} />;
    }
    if (trend === "down") {
      return <TrendingDown className={`${iconClass} ml-1`} />;
    }
    return <Minus className={`${iconClass} ml-1`} />;
  };

  return (
    <Badge
      className={`${config.color} ${config.textColor} ${sizeClasses[size]} flex items-center gap-1`}
    >
      {showIcon && <span>{config.icon}</span>}
      <span className="font-bold">{score.toFixed(0)}</span>
      {showLabel && <span>• {config.label}</span>}
      {getTrendIcon()}
    </Badge>
  );
}

// Circular quality score indicator
export function QualityScoreCircle({
  score,
  size = 80,
}: {
  score: number;
  size?: number;
}) {
  const getScoreConfig = (score: number) => {
    if (score >= 90) return { color: "#10b981", label: "Excellent" };
    if (score >= 75) return { color: "#3b82f6", label: "Good" };
    if (score >= 60) return { color: "#f59e0b", label: "Fair" };
    return { color: "#ef4444", label: "Poor" };
  };

  const config = getScoreConfig(score);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={40}
          stroke="#e5e7eb"
          strokeWidth="8"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={40}
          stroke={config.color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: config.color }}>
          {score.toFixed(0)}
        </span>
        <span className="text-xs text-muted-foreground">{config.label}</span>
      </div>
    </div>
  );
}

// Quality score bar chart
export function QualityScoreBar({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  const getScoreConfig = (score: number) => {
    if (score >= 90)
      return { color: "bg-green-500", textColor: "text-green-600" };
    if (score >= 75)
      return { color: "bg-blue-500", textColor: "text-blue-600" };
    if (score >= 60)
      return { color: "bg-yellow-500", textColor: "text-yellow-600" };
    return { color: "bg-red-500", textColor: "text-red-600" };
  };

  const config = getScoreConfig(score);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={`font-bold ${config.textColor}`}>
          {score.toFixed(0)}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${config.color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
