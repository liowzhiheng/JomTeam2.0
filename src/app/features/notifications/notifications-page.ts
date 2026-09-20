import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/supabase.service';
import { NotificationService } from '../../core/notification.service';

interface NotificationItem { id:string; title:string; body:string|null; type:string; match_id:string|null; profile_id:string|null; read_at:string|null; created_at:string }

@Component({selector:'app-notifications-page',imports:[DatePipe],template:`
  <section class="page-heading"><div><p class="eyebrow">UPDATES</p><h1>Notifications</h1><p>Updates from your matches and community.</p></div><button class="button secondary" type="button" (click)="markAllRead()" [disabled]="!unreadCount()">Mark all as read</button></section>
  @if(loading()){<div class="empty-state"><h2>Loading notifications…</h2></div>}
  @else if(error()){<div class="empty-state"><h2>Notifications could not be loaded</h2><p>{{error()}}</p><button class="button secondary" (click)="load()">Try again</button></div>}
  @else if(items().length){<div class="form-card notification-list">@for(item of items();track item.id){<button type="button" class="notification-entry" [class.unread]="!item.read_at" (click)="open(item)"><span class="notification-symbol">{{symbol(item.type)}}</span><span><strong>{{item.title}}</strong>@if(item.body){<span>{{item.body}}</span>}<small>{{item.created_at|date:'d MMM, h:mm a'}}</small></span></button>}</div>}
  @else{<div class="empty-state"><h2>No notifications yet</h2><p>Match and friend updates will appear here.</p></div>}
`})
export class NotificationsPage implements OnInit{
  private readonly supabase=inject(SupabaseService);private readonly notifications=inject(NotificationService);private readonly router=inject(Router);readonly items=signal<NotificationItem[]>([]);readonly loading=signal(true);readonly error=signal('');readonly unreadCount=()=>this.items().filter(item=>!item.read_at).length;
  ngOnInit(){void this.load();}
  async load(){this.loading.set(true);this.error.set('');try{const {data,error}=await this.supabase.client.from('notifications').select('id,title,body,type,match_id,profile_id,read_at,created_at').order('created_at',{ascending:false}).limit(50);if(error)throw error;this.items.set(data??[]);}catch(error){this.error.set((error as {message?:string})?.message??'Please try again.');}finally{this.loading.set(false);}}
  async open(item:NotificationItem){if(!item.read_at){const now=new Date().toISOString();const {error}=await this.supabase.client.from('notifications').update({read_at:now}).eq('id',item.id);if(!error){this.items.update(items=>items.map(value=>value.id===item.id?{...value,read_at:now}:value));await this.notifications.refresh();}}if(item.match_id)await this.router.navigate(['/matches',item.match_id]);else if(item.profile_id)await this.router.navigate(['/players',item.profile_id]);}
  async markAllRead(){const now=new Date().toISOString();const ids=this.items().filter(item=>!item.read_at).map(item=>item.id);if(!ids.length)return;const {error}=await this.supabase.client.from('notifications').update({read_at:now}).in('id',ids);if(!error){this.items.update(items=>items.map(item=>({...item,read_at:item.read_at??now})));await this.notifications.refresh();}}
  symbol(type:string){return type.includes('accepted')?'✓':type.includes('request')?'+':type.includes('cancel')?'!':'•';}
}
