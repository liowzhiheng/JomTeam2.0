import { Routes } from '@angular/router';
import { activeAccountGuard, adminGuard, authGuard, verifiedEmailGuard } from './core/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'login', loadComponent: () => import('./features/auth/auth-page').then(m => m.AuthPage), data: { mode: 'login' } },
  { path: 'register', loadComponent: () => import('./features/auth/auth-page').then(m => m.AuthPage), data: { mode: 'register' } },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/auth-page').then(m => m.AuthPage), data: { mode: 'forgot' } },
  { path: 'reset-password', loadComponent: () => import('./features/auth/auth-page').then(m => m.AuthPage), data: { mode: 'reset' } },
  { path: 'verify-email', loadComponent: () => import('./features/auth/auth-page').then(m => m.AuthPage), data: { mode: 'verify' } },
  { path: 'terms', loadComponent: () => import('./features/legal/legal-page').then(m => m.LegalPage), data: { document: 'terms' } },
  { path: 'privacy', loadComponent: () => import('./features/legal/legal-page').then(m => m.LegalPage), data: { document: 'privacy' } },
  {
    path: '', loadComponent: () => import('./shared/app-shell').then(m => m.AppShell),
    canActivate: [authGuard, verifiedEmailGuard, activeAccountGuard],
    children: [
      { path: 'home', loadComponent: () => import('./features/home/home-page').then(m => m.HomePage) },
      { path: 'matches', loadComponent: () => import('./features/matches/matches-page').then(m => m.MatchesPage) },
      { path: 'matches/create', loadComponent: () => import('./features/matches/match-form-page').then(m => m.MatchFormPage) },
      { path: 'matches/:id', loadComponent: () => import('./features/matches/match-detail-page').then(m => m.MatchDetailPage) },
      { path: 'matches/:id/edit', loadComponent: () => import('./features/matches/match-form-page').then(m => m.MatchFormPage) },
      { path: 'matches/:id/chat', loadComponent: () => import('./features/chat/chat-page').then(m => m.ChatPage) },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard-page').then(m => m.DashboardPage) },
      { path: 'history', loadComponent: () => import('./features/history/history-page').then(m => m.HistoryPage) },
      { path: 'profile', loadComponent: () => import('./features/profile/profile-page').then(m => m.ProfilePage) },
      { path: 'profile/edit', loadComponent: () => import('./features/profile/profile-page').then(m => m.ProfilePage), data: { edit: true } },
      { path: 'players/:id', loadComponent: () => import('./features/profile/profile-page').then(m => m.ProfilePage) },
      { path: 'friends', loadComponent: () => import('./features/friends/friends-page').then(m => m.FriendsPage), data: { view: 'friends' } },
      { path: 'friend-requests', loadComponent: () => import('./features/friends/friends-page').then(m => m.FriendsPage), data: { view: 'requests' } },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications-page').then(m => m.NotificationsPage) },
      { path: 'feedback', loadComponent: () => import('./features/feedback/feedback-page').then(m => m.FeedbackPage) },
      { path: 'settings/security', loadComponent: () => import('./features/security/security-page').then(m => m.SecurityPage) },
      { path: 'admin', canActivate: [adminGuard], children: [
        { path: '', loadComponent: () => import('./features/admin/admin-page').then(m => m.AdminPage), data: { view: 'overview' } },
        { path: 'users', loadComponent: () => import('./features/admin/admin-page').then(m => m.AdminPage), data: { view: 'users' } },
        { path: 'users/:id', loadComponent: () => import('./features/admin/admin-page').then(m => m.AdminPage), data: { view: 'user-detail' } },
        { path: 'matches', loadComponent: () => import('./features/admin/admin-page').then(m => m.AdminPage), data: { view: 'matches' } },
        { path: 'matches/:id', loadComponent: () => import('./features/admin/admin-page').then(m => m.AdminPage), data: { view: 'match-detail' } },
        { path: 'feedback', loadComponent: () => import('./features/admin/admin-page').then(m => m.AdminPage), data: { view: 'feedback' } }
      ] }
    ]
  },
  { path: '**', redirectTo: 'home' }
];
