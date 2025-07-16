import * as React from "react"
import { Play, Pause, Settings, RotateCcw } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { OptimizationGeneration, OptimizationParameters } from "../types/api"
import { HeatmapCircle } from "@visx/heatmap"
import { scaleLinear } from "@visx/scale"
import { toast } from "../stores/toast-store"

// Mock data - TODO backend: Replace with actual WebSocket data
const mockGenerations: OptimizationGeneration[] = Array.from({ length: 50 }, (_, i) => ({
  generation: i + 1,
  parameters: {
    rsi_period: 14 + Math.random() * 6,
    ma_fast: 10 + Math.random() * 10,
    ma_slow: 20 + Math.random() * 30,
    stop_loss: 0.02 + Math.random() * 0.03,
    take_profit: 0.04 + Math.random() * 0.06
  },
  fitness: Math.random() * 0.3 + 0.5,
  timestamp: new Date(Date.now() - (49 - i) * 60000).toISOString()
}))

const mockParameters: OptimizationParameters = {
  rsi_period: { min: 10, max: 20, step: 1, current: 14 },
  ma_fast: { min: 5, max: 20, step: 1, current: 10 },
  ma_slow: { min: 20, max: 50, step: 1, current: 30 },
  stop_loss: { min: 0.01, max: 0.05, step: 0.001, current: 0.02 },
  take_profit: { min: 0.02, max: 0.1, step: 0.001, current: 0.05 }
}

interface HeatmapData {
  generation: number
  parameter: string
  value: number
  fitness: number
}

function GAHeatmap({ generations }: { generations: OptimizationGeneration[] }) {
  const data: HeatmapData[] = React.useMemo(() => {
    const result: HeatmapData[] = []
    const parameterNames = Object.keys(mockParameters)
    
    generations.forEach(gen => {
      parameterNames.forEach(param => {
        result.push({
          generation: gen.generation,
          parameter: param,
          value: gen.parameters[param] || 0,
          fitness: gen.fitness
        })
      })
    })
    
    return result
  }, [generations])

  const width = 800
  const height = 300
  const margin = { top: 20, right: 20, bottom: 40, left: 100 }
  
  const xScale = scaleLinear({
    domain: [1, Math.max(...generations.map(g => g.generation))],
    range: [margin.left, width - margin.right]
  })
  
  const yScale = scaleLinear({
    domain: [0, Object.keys(mockParameters).length - 1],
    range: [margin.top, height - margin.bottom]
  })
  
  const colorScale = scaleLinear({
    domain: [0.5, 0.8],
    range: ['#ef4444', '#22c55e']
  })

  const parameterNames = Object.keys(mockParameters)
  const cellWidth = (width - margin.left - margin.right) / generations.length
  const cellHeight = (height - margin.top - margin.bottom) / parameterNames.length

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height}>
        {/* Heatmap cells */}
        {data.map((d, i) => {
          const paramIndex = parameterNames.indexOf(d.parameter)
          return (
            <rect
              key={i}
              x={xScale(d.generation) - cellWidth / 2}
              y={yScale(paramIndex) - cellHeight / 2}
              width={cellWidth}
              height={cellHeight}
              fill={colorScale(d.fitness)}
              opacity={0.8}
            />
          )
        })}
        
        {/* Y-axis labels */}
        {parameterNames.map((param, i) => (
          <text
            key={param}
            x={margin.left - 10}
            y={yScale(i) + 5}
            textAnchor="end"
            fontSize="12"
            fill="currentColor"
            className="text-muted-foreground"
          >
            {param.replace('_', ' ')}
          </text>
        ))}
        
        {/* X-axis label */}
        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          fontSize="12"
          fill="currentColor"
          className="text-muted-foreground"
        >
          Generation
        </text>
      </svg>
    </div>
  )
}

function ParameterDrawer({ 
  parameters, 
  isOpen, 
  onClose, 
  onUpdate 
}: { 
  parameters: OptimizationParameters
  isOpen: boolean
  onClose: () => void
  onUpdate: (params: Partial<OptimizationParameters>) => void
}) {
  const [localParams, setLocalParams] = React.useState(parameters)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const validateParameter = (key: string, value: number) => {
    const param = parameters[key]
    if (value < param.min || value > param.max) {
      return `Value must be between ${param.min} and ${param.max}`
    }
    return null
  }

  const handleChange = (key: string, value: number) => {
    const error = validateParameter(key, value)
    setErrors(prev => ({ ...prev, [key]: error || '' }))
    setLocalParams(prev => ({
      ...prev,
      [key]: { ...prev[key], current: value }
    }))
  }

  const handleSubmit = () => {
    const hasErrors = Object.values(errors).some(error => error)
    if (hasErrors) {
      toast.error('Please fix validation errors')
      return
    }
    
    onUpdate(localParams)
    onClose()
    toast.success('Parameters updated successfully')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-background border rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Optimization Parameters</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="space-y-4">
          {Object.entries(localParams).map(([key, param]) => (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium">
                {key.replace('_', ' ').toUpperCase()}
              </label>
              <input
                type="number"
                min={param.min}
                max={param.max}
                step={param.step}
                value={param.current}
                onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
              <div className="text-xs text-muted-foreground">
                Range: {param.min} - {param.max}
              </div>
              {errors[key] && (
                <div className="text-xs text-error">{errors[key]}</div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={handleSubmit} className="flex-1">
            Update Parameters
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

export function OptimizerMonitor() {
  const [generations, setGenerations] = React.useState<OptimizationGeneration[]>(mockGenerations)
  const [parameters, setParameters] = React.useState<OptimizationParameters>(mockParameters)
  const [isRunning, setIsRunning] = React.useState(false)
  const [showParameterDrawer, setShowParameterDrawer] = React.useState(false)

  // Simulate new generations arriving
  React.useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      const newGeneration: OptimizationGeneration = {
        generation: generations.length + 1,
        parameters: {
          rsi_period: 14 + Math.random() * 6,
          ma_fast: 10 + Math.random() * 10,
          ma_slow: 20 + Math.random() * 30,
          stop_loss: 0.02 + Math.random() * 0.03,
          take_profit: 0.04 + Math.random() * 0.06
        },
        fitness: Math.random() * 0.3 + 0.5,
        timestamp: new Date().toISOString()
      }

      setGenerations(prev => [...prev, newGeneration].slice(-50)) // Keep last 50
      
      // Show toast for significant improvements
      if (newGeneration.fitness > 0.75) {
        toast.success(`New best fitness: ${newGeneration.fitness.toFixed(3)}`)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [isRunning, generations.length])

  const handleToggleOptimization = () => {
    setIsRunning(!isRunning)
    toast.info(isRunning ? 'Optimization paused' : 'Optimization started')
  }

  const handleReset = () => {
    setGenerations([])
    setIsRunning(false)
    toast.info('Optimization reset')
  }

  const handleUpdateParameters = (newParams: Partial<OptimizationParameters>) => {
    setParameters(prev => ({ ...prev, ...newParams }))
    
    // TODO backend: Send parameter updates via WebSocket
    // websocket.send(JSON.stringify({
    //   type: 'parameter_update',
    //   data: newParams
    // }))
  }

  const currentGeneration = generations.length > 0 ? generations[generations.length - 1] : null
  const bestFitness = Math.max(...generations.map(g => g.fitness), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Optimizer Monitor</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowParameterDrawer(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Parameters
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleToggleOptimization}>
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isRunning ? 'bg-success animate-pulse' : 'bg-muted'}`} />
              <span className="font-medium">
                {isRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Generation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentGeneration?.generation || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Best Fitness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {bestFitness.toFixed(3)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Fitness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentGeneration?.fitness.toFixed(3) || '0.000'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GA Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Genetic Algorithm Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          {generations.length > 0 ? (
            <GAHeatmap generations={generations} />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No optimization data available. Start the optimizer to see results.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Parameters */}
      {currentGeneration && (
        <Card>
          <CardHeader>
            <CardTitle>Current Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(currentGeneration.parameters).map(([key, value]) => (
                <div key={key} className="text-center p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">
                    {key.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className="text-lg font-bold">
                    {typeof value === 'number' ? value.toFixed(3) : value}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parameter Drawer */}
      <ParameterDrawer
        parameters={parameters}
        isOpen={showParameterDrawer}
        onClose={() => setShowParameterDrawer(false)}
        onUpdate={handleUpdateParameters}
      />
    </div>
  )
}