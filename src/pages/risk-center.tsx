import * as React from "react"
import { RefreshCw, Play, AlertTriangle } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { RiskSnapshot, StressTestRequest, ProgressResponse } from "../types/api"
import { formatCurrency, formatPercentage } from "../lib/utils"
import { toast } from "../stores/toast-store"
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts"

// Mock risk data - TODO backend: Replace with actual WebSocket data
const mockRiskSnapshot: RiskSnapshot = {
  timestamp: new Date().toISOString(),
  var95: 45000,
  var99: 67500,
  expectedShortfall: 82000,
  maxDrawdown: 125000,
  sharpeRatio: 1.45,
  correlationMatrix: [
    [1.0, 0.3, -0.1, 0.2],
    [0.3, 1.0, 0.4, -0.2],
    [-0.1, 0.4, 1.0, 0.1],
    [0.2, -0.2, 0.1, 1.0]
  ],
  exposureByAsset: {
    'AAPL': 250000,
    'TSLA': -125000,
    'MSFT': 180000,
    'GOOGL': 95000
  }
}

const radarData = [
  { metric: 'VaR 95%', value: 0.7, fullMark: 1 },
  { metric: 'VaR 99%', value: 0.8, fullMark: 1 },
  { metric: 'Expected Shortfall', value: 0.9, fullMark: 1 },
  { metric: 'Max Drawdown', value: 0.6, fullMark: 1 },
  { metric: 'Sharpe Ratio', value: 0.8, fullMark: 1 },
  { metric: 'Correlation Risk', value: 0.4, fullMark: 1 }
]

const stressTestScenarios = [
  { id: 'market_crash', name: 'Market Crash (-20%)', description: 'Broad market decline of 20%' },
  { id: 'interest_rate_shock', name: 'Interest Rate Shock (+200bp)', description: 'Federal funds rate increases by 2%' },
  { id: 'volatility_spike', name: 'Volatility Spike (+50%)', description: 'VIX increases by 50%' },
  { id: 'custom', name: 'Custom Scenario', description: 'User-defined stress test parameters' }
]

export function RiskCenter() {
  const [riskData, setRiskData] = React.useState<RiskSnapshot | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedScenario, setSelectedScenario] = React.useState('market_crash')
  const [isRunningStressTest, setIsRunningStressTest] = React.useState(false)
  const [stressTestResults, setStressTestResults] = React.useState<any>(null)

  // Simulate loading risk data
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setRiskData(mockRiskSnapshot)
      setIsLoading(false)
      toast.success('Risk snapshot updated')
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Simulate WebSocket updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (riskData) {
        const updatedData = {
          ...riskData,
          timestamp: new Date().toISOString(),
          var95: riskData.var95 + (Math.random() - 0.5) * 5000,
          var99: riskData.var99 + (Math.random() - 0.5) * 7500,
          sharpeRatio: Math.max(0, riskData.sharpeRatio + (Math.random() - 0.5) * 0.1)
        }
        setRiskData(updatedData)
      }
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [riskData])

  const handleRefreshRisk = () => {
    setIsLoading(true)
    setTimeout(() => {
      setRiskData(mockRiskSnapshot)
      setIsLoading(false)
      toast.success('Risk data refreshed')
    }, 1000)
  }

  const handleRunStressTest = async () => {
    setIsRunningStressTest(true)
    
    try {
      // TODO backend: Implement actual stress test API
      const request: StressTestRequest = {
        scenario: selectedScenario as any,
        parameters: selectedScenario === 'custom' ? { decline: -0.25 } : undefined
      }

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock stress test results
      const mockResults = {
        scenario: selectedScenario,
        pnlImpact: -85000 + Math.random() * 50000,
        portfolioValue: 2450000,
        stressedValue: 2365000,
        worstAssets: [
          { symbol: 'TSLA', impact: -45000 },
          { symbol: 'AAPL', impact: -32000 },
          { symbol: 'MSFT', impact: -18000 }
        ]
      }
      
      setStressTestResults(mockResults)
      toast.success('Stress test completed')
    } catch (error) {
      toast.error('Stress test failed')
    } finally {
      setIsRunningStressTest(false)
    }
  }

  const exposureData = riskData ? Object.entries(riskData.exposureByAsset).map(([symbol, exposure]) => ({
    symbol,
    exposure,
    isShort: exposure < 0
  })) : []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Loading risk snapshot...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Risk Center</h1>
        <Button onClick={handleRefreshRisk} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              VaR (95%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(riskData?.var95 || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              VaR (99%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-error">
              {formatCurrency(riskData?.var99 || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expected Shortfall
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-error">
              {formatCurrency(riskData?.expectedShortfall || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sharpe Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {riskData?.sharpeRatio.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" className="text-xs" />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 1]} 
                  className="text-xs"
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <Radar
                  name="Risk Level"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Exposure Histogram */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Exposure</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={exposureData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="symbol" className="text-xs" />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Exposure']}
                />
                <Bar 
                  dataKey="exposure" 
                  fill={(entry: any) => entry.isShort ? 'hsl(var(--error))' : 'hsl(var(--success))'}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stress Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Stress Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Scenario
              </label>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                {stressTestScenarios.map(scenario => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </option>
                ))}
              </select>
            </div>
            <Button 
              onClick={handleRunStressTest}
              disabled={isRunningStressTest}
              className="gap-2"
            >
              {isRunningStressTest ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isRunningStressTest ? 'Running...' : 'Run Test'}
            </Button>
          </div>

          {stressTestResults && (
            <div className="mt-6 p-4 border rounded-lg bg-muted/20">
              <h4 className="font-medium mb-3">Stress Test Results</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">P&L Impact</div>
                  <div className="text-lg font-bold text-error">
                    {formatCurrency(stressTestResults.pnlImpact)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Portfolio Value</div>
                  <div className="text-lg font-bold">
                    {formatCurrency(stressTestResults.portfolioValue)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Stressed Value</div>
                  <div className="text-lg font-bold text-warning">
                    {formatCurrency(stressTestResults.stressedValue)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}