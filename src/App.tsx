import * as React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AppShell } from "./components/layout/app-shell"
import { ProtectedRoute } from "./components/auth/protected-route"
import { LoginForm } from "./components/auth/login-form"
import { Dashboard } from "./pages/dashboard"
import { Positions } from "./pages/positions"
import { OptimizerMonitor } from "./pages/optimizer-monitor"
import { RiskCenter } from "./pages/risk-center"
import { ExecutionLog } from "./pages/execution-log"
import { ErrorBoundary } from "./components/error-boundary"

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginForm />} />
          
          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="positions" element={<Positions />} />
            <Route path="optimizer" element={<OptimizerMonitor />} />
            <Route path="risk" element={<RiskCenter />} />
            <Route path="execution" element={<ExecutionLog />} />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App