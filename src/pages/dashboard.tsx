import * as React from "react"
import { MetricBadge, MetricBadgeSkeleton } from "../components/ui/metric-badge"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { useTradingStore } from "../stores/trading-store"
import { useWebSocket } from "../hooks/use-websocket"
import { formatTimestamp } from "../lib/utils"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import useSWR from "swr"

// Mock data fetcher - TODO backend: Replace with actual API calls
const fetcher = async (url: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  if (url === '/v1/metrics') {
    return [
      {
        id: 'pnl',
        title: 'Total P&L',
        value: 125430.50,
        change: 2340.20,
        changePercent: 1.87,
        format: 'currency' as const,
        severity: 'normal' as const
      },
      {
        id: 'positions',
        title: 'Open Positions',
        value: 12,
        change: -2,
        changePercent: -14.29,
        format: 'number' as const,
        severity: 'normal' as const
      },
      {
        id: 'exposure',
        title: 'Total Exposure',
        value: 2450000,
        change: 150000,
        changePercent: 6.52,
        format: 'currency' as const,
        severity: 'warning' as const
      },
      {
        id: 'var',
        title: 'VaR (95%)',
        value: 45000,
        change: 5000,
        changePercent: 12.5,
        format: 'currency' as const,
        severity: 'critical' as const
      }
    ]
  }
  
  if (url === '/v1/equity') {
    const now = Date.now()
    return Array.from({ length: 100 }, (_, i) => ({
      timestamp: new Date(now - (99 - i) * 60000).toISOString(),
      value: 100000 + Math.random() * 50000 + i * 500,
      drawdown: Math.random() * -5000
    }))
  }
  
  if (url === '/v1/events') {
    return [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        type: 'trade' as const,
        severity: 'info' as const,
        message: 'Position opened: AAPL 100 shares @ $150.25'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        type: 'optimizer' as const,
        severity: 'success' as const,
        message: 'Optimization completed: Generation 45, Fitness: 0.847'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        type: 'risk' as const,
        severity: 'warning' as const,
        message: 'VaR limit approaching: 89% of daily limit'
      }
    ]
  }
  
  throw new Error(`Unknown endpoint: ${url}`)
}

export function Dashboard() {
  const { metrics, equityData, events, setMetrics, setEquityData, setEvents } = useTradingStore()
  
  // Fetch data with SWR
  const { data: metricsData, isLoading: isLoadingMetrics } = useSWR('/v1/metrics', fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: false
  })
  
  const { data: equityDataResponse, isLoading: isLoadingEquity } = useSWR('/v1/equity', fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: false
  })
  
  const { data: eventsData, isLoading: isLoadingEvents } = useSWR('/v1/events', fetcher, {
    refreshInterval: 2000,
    revalidateOnFocus: false
  })

  // WebSocket connection for real-time updates
  const { isConnected } = useWebSocket({
    url: '/events' // TODO backend: Implement WebSocket endpoint
  })

  // Update store when data changes
  React.useEffect(() => {
    if (metricsData) setMetrics(metricsData)
  }, [metricsData, setMetrics])

  React.useEffect(() => {
    if (equityDataResponse) setEquityData(equityDataResponse)
  }, [equityDataResponse, setEquityData])

  React.useEffect(() => {
    if (eventsData) setEvents(eventsData)
  }, [eventsData, setEvents])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-success' : 'bg-error'}`} />
          {isConnected ? 'Live' : 'Disconnected'}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoadingMetrics ? (
          Array.from({ length: 4 }).map((_, i) => (
            <MetricBadgeSkeleton key={i} />
          ))
        ) : (
          metrics.map((metric) => (
            <MetricBadge key={metric.id} metric={metric} />
          ))
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equity Curve */}
        <Card>
          <CardHeader>
            <CardTitle>Equity Curve</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingEquity ? (
              <div className="h-64 bg-muted rounded skeleton" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={equityData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => formatTimestamp(value)}
                    className="text-xs"
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    className="text-xs"
                  />
                  <Tooltip 
                    labelFormatter={(value) => formatTimestamp(value)}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Equity']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Event Ticker */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingEvents ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-4 w-4 bg-muted rounded-full skeleton" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-3/4 bg-muted rounded skeleton" />
                      <div className="h-3 w-1/2 bg-muted rounded skeleton" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {events.map((event) => (
                  <div key={event.id} className="flex gap-3 text-sm">
                    <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                      event.severity === 'critical' ? 'bg-error animate-pulse' :
                      event.severity === 'warning' ? 'bg-warning' :
                      event.severity === 'error' ? 'bg-error' :
                      'bg-success'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground">{event.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(event.timestamp)} • {event.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}