import * as React from "react"
import { Outlet } from "react-router-dom"
import { TopNav } from "./top-nav"
import { SideRail } from "./side-rail"
import { ToastContainer } from "../ui/toast"
import { useKeyboardShortcuts, globalShortcuts } from "../../hooks/use-keyboard-shortcuts"

export function AppShell() {
  const [isSideRailCollapsed, setIsSideRailCollapsed] = React.useState(false)

  // Register global keyboard shortcuts
  useKeyboardShortcuts(globalShortcuts)

  return (
    <div className="flex h-screen bg-background">
      {/* Side Rail */}
      <SideRail 
        isCollapsed={isSideRailCollapsed}
        onToggle={() => setIsSideRailCollapsed(!isSideRailCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNav />

        {/* Route-driven Viewport */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  )
}