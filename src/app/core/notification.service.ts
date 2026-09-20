import { Injectable, inject, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({providedIn:'root'})
export class NotificationService{
  private readonly supabase=inject(SupabaseService);private channel?:RealtimeChannel;private userId='';readonly unreadCount=signal(0);
  async start(userId:string){if(this.userId===userId&&this.channel){await this.refresh();return;}await this.stop();this.userId=userId;await this.refresh();this.channel=this.supabase.client.channel(`notifications:${userId}`).on('postgres_changes',{event:'*',schema:'public',table:'notifications',filter:`recipient_id=eq.${userId}`},()=>void this.refresh()).subscribe();}
  async refresh(){if(!this.userId){this.unreadCount.set(0);return;}const{count,error}=await this.supabase.client.from('notifications').select('id',{count:'exact',head:true}).eq('recipient_id',this.userId).is('read_at',null);if(!error)this.unreadCount.set(count??0);}
  async stop(){if(this.channel){await this.supabase.client.removeChannel(this.channel);this.channel=undefined;}this.userId='';this.unreadCount.set(0);}
}
