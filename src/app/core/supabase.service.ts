import { Injectable, computed, signal } from '@angular/core';
import { createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Database } from './database.types';
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient<Database> = createClient<Database>(environment.supabaseUrl, environment.supabasePublishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } });
  private readonly sessionState = signal<Session | null>(null);
  readonly session = this.sessionState.asReadonly(); readonly user = computed<User | null>(() => this.sessionState()?.user ?? null); readonly ready = signal(false); readonly initialized: Promise<void>;
  constructor() { this.initialized=this.initialize(); this.client.auth.onAuthStateChange((_event, session) => this.sessionState.set(session)); }
  private async initialize(){
    const code=this.pkceCodeFromHashRoute();
    if(code){
      const{data,error}=await this.client.auth.exchangeCodeForSession(code);
      if(!error){this.sessionState.set(data.session);this.removeCodeFromHashRoute();}
    }
    const{data}=await this.client.auth.getSession();this.sessionState.set(data.session);this.ready.set(true);
  }
  private pkceCodeFromHashRoute(){if(typeof window==='undefined')return null;const queryStart=window.location.hash.indexOf('?');if(queryStart<0)return null;return new URLSearchParams(window.location.hash.slice(queryStart+1)).get('code');}
  private removeCodeFromHashRoute(){const queryStart=window.location.hash.indexOf('?');if(queryStart<0)return;window.history.replaceState(window.history.state,'',`${window.location.pathname}${window.location.search}${window.location.hash.slice(0,queryStart)}`);}
  async signOut(): Promise<void> { const { error } = await this.client.auth.signOut(); if (error) throw error; }
}
