import * as React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { Lock } from "lucide-react"
import { useAuthStore } from "../../stores/auth-store"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

export function ProtectedRoute({ children, requiredRole = "trader" }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role requirements
  if (requiredRole && user && !user.roles.includes(requiredRole)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Lock className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground max-w-md">
            You don't have the required "{requiredRole}" role to access this page.
            Please contact your administrator for access.
          </p>
          <div className="text-sm text-muted-foreground">
            Your roles: {user.roles.join(', ')}
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}