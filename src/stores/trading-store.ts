import { create } from 'zustand'
import { Position, MetricCard, EquityPoint, EventMessage, OrderRequest, OrderResponse } from '../types/api'

interface TradingState {
  // Data
  positions: Position[]
  metrics: MetricCard[]
  equityData: EquityPoint[]
  events: EventMessage[]
  
  // Loading states
  isLoadingPositions: boolean
  isLoadingMetrics: boolean
  isLoadingEquity: boolean
  
  // Actions
  setPositions: (positions: Position[]) => void
  updatePosition: (position: Position) => void
  setMetrics: (metrics: MetricCard[]) => void
  updateMetric: (metric: MetricCard) => void
  setEquityData: (data: EquityPoint[]) => void
  addEquityPoint: (point: EquityPoint) => void
  addEvent: (event: EventMessage) => void
  setEvents: (events: EventMessage[]) => void
  
  // Trading actions
  submitOrder: (order: OrderRequest) => Promise<OrderResponse>
  closePosition: (positionId: string) => Promise<void>
  hedgePosition: (positionId: string, hedgeRatio: number) => Promise<void>
  
  // Loading actions
  setLoadingPositions: (loading: boolean) => void
  setLoadingMetrics: (loading: boolean) => void
  setLoadingEquity: (loading: boolean) => void
}

export const useTradingStore = create<TradingState>((set, get) => ({
  // Initial state
  positions: [],
  metrics: [],
  equityData: [],
  events: [],
  isLoadingPositions: false,
  isLoadingMetrics: false,
  isLoadingEquity: false,

  // Data setters
  setPositions: (positions) => set({ positions }),
  
  updatePosition: (updatedPosition) => set((state) => ({
    positions: state.positions.map(pos => 
      pos.id === updatedPosition.id ? updatedPosition : pos
    )
  })),

  setMetrics: (metrics) => set({ metrics }),
  
  updateMetric: (updatedMetric) => set((state) => ({
    metrics: state.metrics.map(metric => 
      metric.id === updatedMetric.id ? updatedMetric : metric
    )
  })),

  setEquityData: (equityData) => set({ equityData }),
  
  addEquityPoint: (point) => set((state) => ({
    equityData: [...state.equityData, point].slice(-1000) // Keep last 1000 points
  })),

  addEvent: (event) => set((state) => ({
    events: [event, ...state.events].slice(0, 100) // Keep last 100 events
  })),

  setEvents: (events) => set({ events }),

  // Trading actions
  submitOrder: async (order) => {
    try {
      // TODO backend: Implement actual order submission
      const response = await fetch('/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(order)
      })

      if (!response.ok) {
        throw new Error('Order submission failed')
      }

      const result: OrderResponse = await response.json()
      
      // Add optimistic update for position
      if (result.status === 'pending') {
        const optimisticPosition: Position = {
          id: result.orderId,
          symbol: order.symbol,
          quantity: order.side === 'buy' ? order.quantity : -order.quantity,
          avgPrice: order.price || 0,
          currentPrice: order.price || 0,
          pnl: 0,
          pnlPercent: 0,
          side: order.side === 'buy' ? 'long' : 'short',
          status: 'open',
          timestamp: new Date().toISOString()
        }
        
        get().updatePosition(optimisticPosition)
      }

      return result
    } catch (error) {
      // Mock successful order for development
      const mockResponse: OrderResponse = {
        orderId: `order_${Date.now()}`,
        status: 'pending',
        message: 'Order submitted successfully'
      }
      
      return mockResponse
    }
  },

  closePosition: async (positionId) => {
    const position = get().positions.find(p => p.id === positionId)
    if (!position) return

    const closeOrder: OrderRequest = {
      symbol: position.symbol,
      side: position.side === 'long' ? 'sell' : 'buy',
      quantity: Math.abs(position.quantity),
      orderType: 'market'
    }

    await get().submitOrder(closeOrder)
    
    // Update position status optimistically
    get().updatePosition({ ...position, status: 'closing' })
  },

  hedgePosition: async (positionId, hedgeRatio) => {
    const position = get().positions.find(p => p.id === positionId)
    if (!position) return

    const hedgeQuantity = Math.abs(position.quantity) * hedgeRatio
    const hedgeOrder: OrderRequest = {
      symbol: position.symbol,
      side: position.side === 'long' ? 'sell' : 'buy',
      quantity: hedgeQuantity,
      orderType: 'market'
    }

    await get().submitOrder(hedgeOrder)
  },

  // Loading setters
  setLoadingPositions: (loading) => set({ isLoadingPositions: loading }),
  setLoadingMetrics: (loading) => set({ isLoadingMetrics: loading }),
  setLoadingEquity: (loading) => set({ isLoadingEquity: loading })
}))