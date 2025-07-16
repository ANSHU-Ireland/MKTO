import * as React from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "../../lib/utils"
import { MetricCard } from "../../types/api"
import { formatCurrency, formatPercentage, formatNumber } from "../../lib/utils"

interface MetricBadgeProps {
  metric: MetricCard
  className?: string
}

export function MetricBadge({ metric, className }: MetricBadgeProps) {
  const isPositive = metric.change > 0
  const isNegative = metric.change < 0
  const isNeutral = metric.change === 0

  const formatValue = (value: string | number) => {
    if (typeof value === 'string') return value
    
    switch (metric.format) {
      case 'currency':
        return formatCurrency(value)
      case 'percentage':
        return formatPercentage(value)
      case 'number':
      default:
        return formatNumber(value)
    }
  }

  const severityStyles = {
    normal: "",
    warning: "border-warning/50 bg-warning/10",
    critical: "border-error/50 bg-error/10 animate-pulse"
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md",
        severityStyles[metric.severity || 'normal'],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {metric.title}
        </h3>
        
        {metric.severity === 'critical' && (
          <div className="h-2 w-2 rounded-full bg-error animate-pulse" />
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-2xl font-bold">
          {formatValue(metric.value)}
        </div>

        <div
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isPositive && "text-success",
            isNegative && "text-error",
            isNeutral && "text-muted-foreground"
          )}
        >
          {isPositive && <TrendingUp className="h-4 w-4" />}
          {isNegative && <TrendingDown className="h-4 w-4" />}
          {isNeutral && <Minus className="h-4 w-4" />}
          
          <span>
            {isPositive && "+"}
            {formatNumber(metric.change)}
          </span>
          
          <span className="text-xs text-muted-foreground">
            ({isPositive && "+"}{formatPercentage(metric.changePercent)})
          </span>
        </div>
      </div>
    </div>
  )
}

export function MetricBadgeSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 bg-muted rounded skeleton" />
      </div>
      
      <div className="mt-2 flex items-baseline justify-between">
        <div className="h-8 w-24 bg-muted rounded skeleton" />
        <div className="h-5 w-16 bg-muted rounded skeleton" />
      </div>
    </div>
  )
}