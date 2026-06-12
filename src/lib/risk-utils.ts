export type RiskLevel = "low" | "medium" | "high" | "critical"

export interface RiskInfo {
  level: RiskLevel
  label: string
  labelIt: string
  hex: string
  textClass: string
  bgClass: string
  borderClass: string
  badgeClass: string
}

export function getRiskInfo(score: number): RiskInfo {
  if (score <= 30) {
    return {
      level: "low",
      label: "LOW",
      labelIt: "Basso",
      hex: "#22c55e",
      textClass: "text-green-600 dark:text-green-400",
      bgClass: "bg-green-500",
      borderClass: "border-green-500",
      badgeClass: "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30",
    }
  }
  if (score <= 60) {
    return {
      level: "medium",
      label: "MEDIUM",
      labelIt: "Medio",
      hex: "#eab308",
      textClass: "text-yellow-600 dark:text-yellow-400",
      bgClass: "bg-yellow-500",
      borderClass: "border-yellow-500",
      badgeClass: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30",
    }
  }
  if (score <= 80) {
    return {
      level: "high",
      label: "HIGH",
      labelIt: "Alto",
      hex: "#f97316",
      textClass: "text-orange-500 dark:text-orange-400",
      bgClass: "bg-orange-500",
      borderClass: "border-orange-500",
      badgeClass: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/30",
    }
  }
  return {
    level: "critical",
    label: "CRITICAL",
    labelIt: "Critico",
    hex: "#ef4444",
    textClass: "text-red-600 dark:text-red-400",
    bgClass: "bg-red-500",
    borderClass: "border-red-500",
    badgeClass: "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30",
  }
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
