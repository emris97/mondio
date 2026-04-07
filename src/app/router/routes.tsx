import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { RootLayout } from '@/app/router/root-layout'
import { DashboardPage } from '@/pages/dashboard'
import { CompetitionPage } from '@/pages/competition'
import { ScoringPage } from '@/pages/scoring'
import { ResultsPage } from '@/pages/results'
import { SettingsPage } from '@/pages/settings'

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

export const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
