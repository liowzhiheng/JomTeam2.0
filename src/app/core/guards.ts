import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
export const authGuard: CanActivateFn = async () => { const auth = inject(AuthService); const router = inject(Router); await auth.ensureReady(); return auth.isAuthenticated() || router.createUrlTree(['/login']); };
export const verifiedEmailGuard: CanActivateFn = async () => { const auth = inject(AuthService); const router = inject(Router); await auth.ensureReady(); const user = auth.user(); return !user || !!user.email_confirmed_at || router.createUrlTree(['/verify-email']); };
export const activeAccountGuard: CanActivateFn = async () => { const auth = inject(AuthService); const router = inject(Router); await auth.ensureReady(); return auth.accountStatus() === 'active' || router.createUrlTree(['/login'], { queryParams: { reason: 'deactivated' } }); };
export const adminGuard: CanActivateFn = async () => { const auth = inject(AuthService); const router = inject(Router); await auth.ensureReady(); return auth.role() === 'admin' || router.createUrlTree(['/home']); };
