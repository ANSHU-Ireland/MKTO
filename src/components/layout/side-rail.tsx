import * as React from "react"
import { NavLink } from "react-router-dom"
import { 
  BarChart3, 
  TrendingUp, 
  Settings, 
  Shield, 
  FileText, 
  ChevronLeft,
  ChevronRight,
  Activity
} from "lucide-react"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

interface SideRailProps {
  isCollapsed: boolean
  onToggle: () => void
}

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: BarChart3,
    shortcut: "1"
  },
  {
    name: "Positions",
    href: "/positions",
    icon: TrendingUp,
    shortcut: "2"
  },
  {
    name: "Optimizer Monitor",
    href: "/optimizer",
    icon: Settings,
    shortcut: "3"
  },
  {
    name: "Risk Center",
    href: "/risk",
    icon: Shield,
    shortcut: "4"
  },
  {
    name: "Execution Log",
    href: "/execution",
    icon: FileText,
    shortcut: "5"
  }
]

export function SideRail({ isCollapsed, onToggle }: SideRailProps) {
  return (
    <div
      className={cn(
        "flex flex-col border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-semibold">MKTO Trading</span>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
                isCollapsed && "justify-center"
              )
            }
            title={isCollapsed ? `${item.name} (Ctrl+${item.shortcut})` : undefined}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1">{item.name}</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>{item.shortcut}
                </kbd>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-2">
        <div
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-xs text-muted-foreground",
            isCollapsed && "justify-center"
          )}
        >
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          {!isCollapsed && <span>Connected</span>}
        </div>
      </div>
    </div>
  )
}