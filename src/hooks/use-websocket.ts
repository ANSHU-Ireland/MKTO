import { useEffect, useRef, useState } from 'react'
import { Subject, Observable } from 'rxjs'
import { WSEvent } from '../types/api'

interface WebSocketConfig {
  url: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useWebSocket(config: WebSocketConfig) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const subjectRef = useRef<Subject<WSEvent>>(new Subject())
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const { url, reconnectInterval = 3000, maxReconnectAttempts = 5 } = config

  const connect = () => {
    try {
      // TODO backend: Replace with actual WebSocket URL
      const wsUrl = url || `${import.meta.env.VITE_WS_URL || 'ws://localhost:8080'}/ws`
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
        console.log('WebSocket connected')
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data: WSEvent = JSON.parse(event.data)
          subjectRef.current.next(data)
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      wsRef.current.onclose = () => {
        setIsConnected(false)
        console.log('WebSocket disconnected')
        
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnecting... (attempt ${reconnectAttemptsRef.current})`)
            connect()
          }, reconnectInterval)
        } else {
          setError('Max reconnection attempts reached')
        }
      }

      wsRef.current.onerror = (event) => {
        console.error('WebSocket error:', event)
        setError('WebSocket connection error')
      }
    } catch (err) {
      setError('Failed to create WebSocket connection')
      console.error('WebSocket creation error:', err)
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }

  const send = (data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  useEffect(() => {
    connect()
    return () => {
      disconnect()
      subjectRef.current.complete()
    }
  }, [url])

  const observable = new Observable<WSEvent>((subscriber) => {
    const subscription = subjectRef.current.subscribe(subscriber)
    return () => subscription.unsubscribe()
  })

  return {
    isConnected,
    error,
    send,
    observable,
    reconnect: connect,
    disconnect
  }
}