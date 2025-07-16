import * as React from "react"
import { Copy, Filter, Search } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { FIXMessage } from "../types/api"
import { formatTimestamp, copyToClipboard, cn } from "../lib/utils"
import { toast } from "../stores/toast-store"
import { FixedSizeList as List } from "react-window"
import InfiniteLoader from "react-window-infinite-loader"

// Mock FIX messages - TODO backend: Replace with actual API
const generateMockMessages = (count: number, startIndex: number = 0): FIXMessage[] => {
  const messageTypes = ['NewOrderSingle', 'ExecutionReport', 'OrderCancelRequest', 'OrderCancelReject', 'Heartbeat']
  const symbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN']
  const sides = ['Buy', 'Sell']
  const statuses = ['New', 'PartiallyFilled', 'Filled', 'Canceled', 'Rejected']

  return Array.from({ length: count }, (_, i) => {
    const index = startIndex + i
    const messageType = messageTypes[Math.floor(Math.random() * messageTypes.length)]
    const symbol = symbols[Math.floor(Math.random() * symbols.length)]
    const side = sides[Math.floor(Math.random() * sides.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const orderId = `ORD${String(index).padStart(6, '0')}`
    
    return {
      id: `msg_${index}`,
      timestamp: new Date(Date.now() - (count - i) * 1000).toISOString(),
      direction: Math.random() > 0.5 ? 'inbound' : 'outbound',
      messageType,
      orderId: messageType.includes('Order') ? orderId : undefined,
      symbol: messageType !== 'Heartbeat' ? symbol : undefined,
      side: messageType.includes('Order') ? side : undefined,
      quantity: messageType.includes('Order') ? Math.floor(Math.random() * 1000) + 100 : undefined,
      price: messageType.includes('Order') ? 100 + Math.random() * 200 : undefined,
      status: messageType === 'ExecutionReport' ? status : undefined,
      rawMessage: `8=FIX.4.2|9=178|35=${messageType}|49=SENDER|56=TARGET|34=${index}|52=${new Date().toISOString()}|11=${orderId}|21=1|55=${symbol}|54=${side === 'Buy' ? '1' : '2'}|60=${new Date().toISOString()}|10=123|`
    }
  })
}

const messageTypeColors = {
  'NewOrderSingle': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'ExecutionReport': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'OrderCancelRequest': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'OrderCancelReject': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'Heartbeat': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
}

interface MessageRowProps {
  index: number
  style: React.CSSProperties
  data: {
    messages: FIXMessage[]
    onCopyOrderId: (orderId: string) => void
  }
}

function MessageRow({ index, style, data }: MessageRowProps) {
  const message = data.messages[index]
  if (!message) return null

  const handleCopyOrderId = () => {
    if (message.orderId) {
      data.onCopyOrderId(message.orderId)
    }
  }

  return (
    <div style={style} className="px-4 py-2 border-b hover:bg-muted/50">
      <div className="flex items-center gap-4 text-sm">
        <div className="w-20 text-xs text-muted-foreground">
          {formatTimestamp(message.timestamp)}
        </div>
        
        <div className={cn(
          "w-4 h-4 rounded-full flex-shrink-0",
          message.direction === 'inbound' ? 'bg-success' : 'bg-primary'
        )} />
        
        <div className="w-32">
          <span className={cn(
            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
            messageTypeColors[message.messageType as keyof typeof messageTypeColors] || 'bg-gray-100 text-gray-800'
          )}>
            {message.messageType}
          </span>
        </div>
        
        <div className="w-20 font-mono text-xs">
          {message.symbol || '-'}
        </div>
        
        <div className="w-16 text-xs">
          {message.side || '-'}
        </div>
        
        <div className="w-20 text-xs text-right">
          {message.quantity?.toLocaleString() || '-'}
        </div>
        
        <div className="w-20 text-xs text-right">
          {message.price ? `$${message.price.toFixed(2)}` : '-'}
        </div>
        
        <div className="w-24 text-xs">
          {message.status || '-'}
        </div>
        
        <div className="flex-1 flex items-center gap-2">
          {message.orderId && (
            <>
              <span className="font-mono text-xs">{message.orderId}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopyOrderId}
                title="Copy Order ID"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function ExecutionLog() {
  const [messages, setMessages] = React.useState<FIXMessage[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [hasNextPage, setHasNextPage] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedMessageType, setSelectedMessageType] = React.useState('all')

  // Load initial messages
  React.useEffect(() => {
    const initialMessages = generateMockMessages(50)
    setMessages(initialMessages)
  }, [])

  // Simulate real-time message updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      const newMessage = generateMockMessages(1, messages.length)[0]
      setMessages(prev => [newMessage, ...prev].slice(0, 1000)) // Keep last 1000 messages
    }, 3000)

    return () => clearInterval(interval)
  }, [messages.length])

  const loadMoreMessages = React.useCallback(async () => {
    if (isLoading) return
    
    setIsLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newMessages = generateMockMessages(25, messages.length)
    setMessages(prev => [...prev, ...newMessages])
    
    // Simulate end of data after 500 messages
    if (messages.length > 500) {
      setHasNextPage(false)
    }
    
    setIsLoading(false)
  }, [isLoading, messages.length])

  const handleCopyOrderId = (orderId: string) => {
    copyToClipboard(orderId)
    toast.success(`Order ID ${orderId} copied to clipboard`)
  }

  // Filter messages based on search and message type
  const filteredMessages = React.useMemo(() => {
    return messages.filter(message => {
      const matchesSearch = !searchTerm || 
        message.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.messageType.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = selectedMessageType === 'all' || 
        message.messageType === selectedMessageType
      
      return matchesSearch && matchesType
    })
  }, [messages, searchTerm, selectedMessageType])

  const isItemLoaded = (index: number) => !!filteredMessages[index]

  const itemCount = hasNextPage ? filteredMessages.length + 1 : filteredMessages.length

  const loadMoreItems = isLoading ? () => {} : loadMoreMessages

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Execution Log</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Live Feed
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by Order ID, Symbol, or Message Type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-3 border border-input rounded-md bg-background text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedMessageType}
                onChange={(e) => setSelectedMessageType(e.target.value)}
                className="h-10 px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="all">All Messages</option>
                <option value="NewOrderSingle">New Orders</option>
                <option value="ExecutionReport">Executions</option>
                <option value="OrderCancelRequest">Cancel Requests</option>
                <option value="OrderCancelReject">Cancel Rejects</option>
                <option value="Heartbeat">Heartbeats</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle>FIX Messages ({filteredMessages.length.toLocaleString()})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="flex items-center gap-4 p-4 border-b bg-muted/20 text-sm font-medium text-muted-foreground">
            <div className="w-20">Time</div>
            <div className="w-4">Dir</div>
            <div className="w-32">Message Type</div>
            <div className="w-20">Symbol</div>
            <div className="w-16">Side</div>
            <div className="w-20 text-right">Quantity</div>
            <div className="w-20 text-right">Price</div>
            <div className="w-24">Status</div>
            <div className="flex-1">Order ID</div>
          </div>

          {/* Virtualized Message List */}
          <div className="h-96">
            <InfiniteLoader
              isItemLoaded={isItemLoaded}
              itemCount={itemCount}
              loadMoreItems={loadMoreItems}
            >
              {({ onItemsRendered, ref }) => (
                <List
                  ref={ref}
                  height={384}
                  itemCount={itemCount}
                  itemSize={60}
                  itemData={{
                    messages: filteredMessages,
                    onCopyOrderId: handleCopyOrderId
                  }}
                  onItemsRendered={onItemsRendered}
                >
                  {MessageRow}
                </List>
              )}
            </InfiniteLoader>
          </div>

          {isLoading && (
            <div className="p-4 text-center text-muted-foreground">
              Loading more messages...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}