import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/shared/hooks/use-theme'
import { DashboardPage } from '@/pages/dashboard'
import { CompetitionPage } from '@/pages/competition'
import { ScoringPage } from '@/pages/scoring'
import { ResultsPage } from '@/pages/results'
import { SettingsPage } from '@/pages/settings'

function RootLayout() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50"
        aria-label="Переключить тему"
      >
        {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </Button>
      <Outlet />
    </div>
  )
}

const rootRoute = createRootRoute({
  component: RootLayout,
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
})

const competitionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/competition/$id',
  component: CompetitionPage,
})

const scoringRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/competition/$id/participant/$pid',
  component: ScoringPage,
})

const resultsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/competition/$id/results',
  component: ResultsPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
})

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  competitionRoute,
  scoringRoute,
  resultsRoute,
  settingsRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
