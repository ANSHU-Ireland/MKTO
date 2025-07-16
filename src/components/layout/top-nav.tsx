import * as React from "react"
import { Moon, Sun, Search, Bell, User, Settings, LogOut } from "lucide-react"
import { Button } from "../ui/button"
import { useTheme } from "../../hooks/use-theme"
import { useAuthStore } from "../../stores/auth-store"
import { cn } from "../../lib/utils"

export function TopNav() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = React.useState(false)

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      {/* Left side - Search */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search... (Ctrl+K)"
            className="h-9 w-64 rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" title="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        {/* User menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="relative"
          >
            <User className="h-4 w-4" />
          </Button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-md border bg-popover p-1 shadow-md">
              <div className="px-3 py-2 text-sm">
                <div className="font-medium">{user?.email}</div>
                <div className="text-xs text-muted-foreground">
                  {user?.roles.join(', ')}
                </div>
              </div>
              
              <div className="h-px bg-border my-1" />
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-error hover:text-error"
                onClick={() => {
                  logout()
                  setShowUserMenu(false)
                }}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}