// API Type Definitions
// TODO backend: Implement these endpoints and WebSocket channels

export interface Position {
  id: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  side: 'long' | 'short';
  status: 'open' | 'closing' | 'closed';
  timestamp: string;
}

export interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changePercent: number;
  severity?: 'normal' | 'warning' | 'critical';
  format: 'currency' | 'percentage' | 'number';
}

export interface EquityPoint {
  timestamp: string;
  value: number;
  drawdown?: number;
}

export interface EventMessage {
  id: string;
  timestamp: string;
  type: 'trade' | 'risk' | 'system' | 'optimizer';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metadata?: Record<string, any>;
}

export interface OrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  orderType: 'market' | 'limit';
  price?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

export interface OrderResponse {
  orderId: string;
  status: 'pending' | 'filled' | 'rejected' | 'cancelled';
  message?: string;
}

export interface OptimizationGeneration {
  generation: number;
  parameters: Record<string, number>;
  fitness: number;
  timestamp: string;
}

export interface OptimizationParameters {
  [key: string]: {
    min: number;
    max: number;
    step: number;
    current: number;
  };
}

export interface RiskSnapshot {
  timestamp: string;
  var95: number;
  var99: number;
  expectedShortfall: number;
  maxDrawdown: number;
  sharpeRatio: number;
  correlationMatrix: number[][];
  exposureByAsset: Record<string, number>;
  stressTestResults?: StressTestResult[];
}

export interface StressTestResult {
  scenario: string;
  pnlImpact: number;
  description: string;
}

export interface StressTestRequest {
  scenario: 'market_crash' | 'interest_rate_shock' | 'volatility_spike' | 'custom';
  parameters?: Record<string, number>;
}

export interface ProgressResponse {
  id: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
}

export interface FIXMessage {
  id: string;
  timestamp: string;
  direction: 'inbound' | 'outbound';
  messageType: string;
  orderId?: string;
  symbol?: string;
  side?: string;
  quantity?: number;
  price?: number;
  status?: string;
  rawMessage: string;
}

export interface User {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface AuthToken {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

// WebSocket Event Types
export type WSEvent = 
  | { type: 'position_update'; data: Position }
  | { type: 'metric_update'; data: MetricCard }
  | { type: 'equity_update'; data: EquityPoint }
  | { type: 'event_message'; data: EventMessage }
  | { type: 'optimization_generation'; data: OptimizationGeneration }
  | { type: 'risk_snapshot'; data: RiskSnapshot }
  | { type: 'fix_message'; data: FIXMessage }
  | { type: 'order_update'; data: { orderId: string; status: string; message?: string } };

// REST API Endpoints
export interface APIEndpoints {
  // Authentication - TODO backend
  '/auth/login': { method: 'POST'; body: { email: string; password: string }; response: AuthToken };
  '/auth/refresh': { method: 'POST'; body: { refreshToken: string }; response: AuthToken };
  '/auth/logout': { method: 'POST'; body: {}; response: { success: boolean } };
  
  // Data endpoints - TODO backend
  '/v1/positions': { method: 'GET'; response: Position[] };
  '/v1/metrics': { method: 'GET'; response: MetricCard[] };
  '/v1/equity': { method: 'GET'; response: EquityPoint[] };
  '/v1/events': { method: 'GET'; response: EventMessage[] };
  
  // Trading - TODO backend
  '/v1/orders': { method: 'POST'; body: OrderRequest; response: OrderResponse };
  
  // Risk - TODO backend
  '/v1/risk/snapshot': { method: 'GET'; response: RiskSnapshot };
  '/v1/risk/stress': { method: 'POST'; body: StressTestRequest; response: { id: string } };
  '/progress/<id>': { method: 'GET'; response: ProgressResponse };
  
  // Optimization - TODO backend
  '/v1/optimization/parameters': { method: 'GET'; response: OptimizationParameters };
  '/v1/optimization/parameters': { method: 'PATCH'; body: Partial<OptimizationParameters>; response: { success: boolean } };
  
  // Execution - TODO backend
  '/v1/execution/messages': { method: 'GET'; response: FIXMessage[] };
  
  // Logging - TODO backend (optional)
  '/v1/logs/client': { method: 'POST'; body: { error: string; stack: string; url: string }; response: { success: boolean } };
}

// WebSocket Channels - TODO backend
export interface WSChannels {
  '/events': EventMessage;
  '/positions': Position;
  '/metrics': MetricCard;
  '/equity': EquityPoint;
  '/optimization': OptimizationGeneration;
  '/risk': RiskSnapshot;
  '/execution': FIXMessage;
  '/optimize-admin': { type: 'parameter_update'; data: Partial<OptimizationParameters> };
}