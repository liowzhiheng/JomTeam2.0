import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { SupabaseService } from './supabase.service';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService); readonly user = this.supabase.user; readonly ready = this.supabase.ready; readonly isAuthenticated = computed(() => !!this.user());
  readonly role = signal<'user' | 'admin'>('user'); readonly accountStatus = signal<'active' | 'deactivated'>('active');
  async ensureReady() { await this.supabase.initialized; const user=this.user(); if(!user) return; const [{data:role},{data:profile}]=await Promise.all([this.supabase.client.from('user_roles').select('role').eq('user_id',user.id).single(),this.supabase.client.from('profiles').select('status').eq('id',user.id).single()]); this.role.set(role?.role==='admin'?'admin':'user'); this.accountStatus.set(profile?.status==='deactivated'?'deactivated':'active'); }
  private callbackUrl(route:string){const base=typeof document==='undefined'?environment.appUrl:document.baseURI;return `${base.replace(/\/$/,'')}/#/${route}`;}
  async signIn(email: string, password: string) { return this.supabase.client.auth.signInWithPassword({ email, password }); }
  async register(email: string, password: string, data: Record<string, unknown>) { return this.supabase.client.auth.signUp({ email, password, options: { data, emailRedirectTo: this.callbackUrl('verify-email') } }); }
  async sendPasswordReset(email: string) { return this.supabase.client.auth.resetPasswordForEmail(email, { redirectTo: this.callbackUrl('reset-password') }); }
  async resendVerification(email: string) { return this.supabase.client.auth.resend({ type: 'signup', email, options: { emailRedirectTo: this.callbackUrl('verify-email') } }); }
  async updatePassword(password: string) { return this.supabase.client.auth.updateUser({ password }); }
  async signOut() { return this.supabase.signOut(); }
}
