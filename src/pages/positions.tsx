import * as React from "react"
import { ChevronDown, ChevronRight, X, Shield, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Position } from "../types/api"
import { formatCurrency, formatPercentage, formatTimestamp, cn } from "../lib/utils"
import { useTradingStore } from "../stores/trading-store"
import { toast } from "../stores/toast-store"
import useSWR from "swr"

// Mock positions data - TODO backend: Replace with actual API
const mockPositions: Position[] = [
  {
    id: '1',
    symbol: 'AAPL',
    quantity: 100,
    avgPrice: 150.25,
    currentPrice: 152.80,
    pnl: 255.00,
    pnlPercent: 1.70,
    side: 'long',
    status: 'open',
    timestamp: new Date().toISOString()
  },
  {
    id: '2',
    symbol: 'TSLA',
    quantity: -50,
    avgPrice: 245.60,
    currentPrice: 240.30,
    pnl: 265.00,
    pnlPercent: 2.16,
    side: 'short',
    status: 'open',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '3',
    symbol: 'MSFT',
    quantity: 75,
    avgPrice: 310.45,
    currentPrice: 308.90,
    pnl: -116.25,
    pnlPercent: -0.50,
    side: 'long',
    status: 'open',
    timestamp: new Date(Date.now() - 7200000).toISOString()
  }
]

const fetcher = async (url: string) => {
  await new Promise(resolve => setTimeout(resolve, 800))
  if (url === '/v1/positions') {
    return mockPositions
  }
  throw new Error(`Unknown endpoint: ${url}`)
}

interface PositionRowProps {
  position: Position
  isExpanded: boolean
  onToggle: () => void
  onClose: () => void
  onHedge: () => void
}

function PositionRow({ position, isExpanded, onToggle, onClose, onHedge }: PositionRowProps) {
  const isProfit = position.pnl > 0
  const isLoss = position.pnl < 0
  
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Main row */}
      <div
        className={cn(
          "flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
          position.status === 'closing' && "opacity-60"
        )}
        onClick={onToggle}
      >
        <Button variant="ghost" size="icon" className="h-6 w-6">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        <div className="flex-1 grid grid-cols-7 gap-4 items-center">
          <div className="font-medium">{position.symbol}</div>
          
          <div className="flex items-center gap-2">
            {position.side === 'long' ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-error" />
            )}
            <span className={position.side === 'long' ? 'text-success' : 'text-error'}>
              {position.side.toUpperCase()}
            </span>
          </div>
          
          <div>{Math.abs(position.quantity).toLocaleString()}</div>
          <div>{formatCurrency(position.avgPrice)}</div>
          <div>{formatCurrency(position.currentPrice)}</div>
          
          <div className={cn(
            "font-medium",
            isProfit && "text-success",
            isLoss && "text-error"
          )}>
            {formatCurrency(position.pnl)}
            <div className="text-xs text-muted-foreground">
              {formatPercentage(position.pnlPercent)}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onHedge()
              }}
              disabled={position.status === 'closing'}
            >
              <Shield className="h-3 w-3 mr-1" />
              Hedge
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              disabled={position.status === 'closing'}
            >
              <X className="h-3 w-3 mr-1" />
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t bg-muted/20 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Position ID</div>
              <div className="font-mono">{position.id}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Opened</div>
              <div>{formatTimestamp(position.timestamp)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Status</div>
              <div className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                position.status === 'open' && "bg-success/10 text-success",
                position.status === 'closing' && "bg-warning/10 text-warning",
                position.status === 'closed' && "bg-muted text-muted-foreground"
              )}>
                {position.status}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Market Value</div>
              <div>{formatCurrency(Math.abs(position.quantity) * position.currentPrice)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function Positions() {
  const { positions, setPositions, closePosition, hedgePosition } = useTradingStore()
  const [expandedPositions, setExpandedPositions] = React.useState<Set<string>>(new Set())
  const [showHedgeDialog, setShowHedgeDialog] = React.useState<string | null>(null)

  const { data: positionsData, isLoading } = useSWR('/v1/positions', fetcher, {
    refreshInterval: 3000,
    revalidateOnFocus: false
  })

  React.useEffect(() => {
    if (positionsData) {
      setPositions(positionsData)
    }
  }, [positionsData, setPositions])

  const toggleExpanded = (positionId: string) => {
    const newExpanded = new Set(expandedPositions)
    if (newExpanded.has(positionId)) {
      newExpanded.delete(positionId)
    } else {
      newExpanded.add(positionId)
    }
    setExpandedPositions(newExpanded)
  }

  const handleClosePosition = async (positionId: string) => {
    try {
      await closePosition(positionId)
      toast.success('Close order submitted successfully')
    } catch (error) {
      toast.error('Failed to close position')
    }
  }

  const handleHedgePosition = async (positionId: string) => {
    try {
      await hedgePosition(positionId, 0.5) // 50% hedge
      toast.success('Hedge order submitted successfully')
      setShowHedgeDialog(null)
    } catch (error) {
      toast.error('Failed to hedge position')
    }
  }

  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0)
  const openPositions = positions.filter(pos => pos.status === 'open').length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded skeleton" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded skeleton" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded skeleton" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Positions</h1>
        <Button>New Position</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openPositions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              totalPnL > 0 && "text-success",
              totalPnL < 0 && "text-error"
            )}>
              {formatCurrency(totalPnL)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Market Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                positions.reduce((sum, pos) => 
                  sum + Math.abs(pos.quantity) * pos.currentPrice, 0
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Positions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-7 gap-4 p-4 border-b bg-muted/20 text-sm font-medium text-muted-foreground">
            <div className="pl-10">Symbol</div>
            <div>Side</div>
            <div>Quantity</div>
            <div>Avg Price</div>
            <div>Current Price</div>
            <div>P&L</div>
            <div>Actions</div>
          </div>

          {/* Position Rows */}
          <div className="divide-y">
            {positions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No positions found
              </div>
            ) : (
              positions.map((position) => (
                <PositionRow
                  key={position.id}
                  position={position}
                  isExpanded={expandedPositions.has(position.id)}
                  onToggle={() => toggleExpanded(position.id)}
                  onClose={() => handleClosePosition(position.id)}
                  onHedge={() => setShowHedgeDialog(position.id)}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}