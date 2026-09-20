import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatchRepository } from '../../core/match.repository';
import { AuthService } from '../../core/auth.service';
import { SupabaseService } from '../../core/supabase.service';

interface HostedRequest { id:string; matchTitle:string; playerName:string; initials:string }

@Component({selector:'app-dashboard-page',imports:[RouterLink],template:`
  <section class="page-heading"><div><p class="eyebrow">YOUR ACTIVITY</p><h1>Dashboard</h1><p>Everything happening across your matches and community.</p></div></section>
  <section class="onboarding-card" aria-label="Getting started">
    <div><p class="eyebrow">YOUR JOMTEAM JOURNEY</p><h2>Make your next game happen.</h2><p>Complete these real milestones to get the most out of your community.</p></div>
    <div class="onboarding-steps">
      <span [class.done]="profileReady()"><i>{{profileReady()?'✓':'1'}}</i>Complete profile</span>
      <span [class.done]="stats().joined>0"><i>{{stats().joined>0?'✓':'2'}}</i>Join a match</span>
      <span [class.done]="stats().friends>0"><i>{{stats().friends>0?'✓':'3'}}</i>Make a friend</span>
    </div>
  </section>
  <div class="metric-grid"><div><span>Pending requests</span><strong>{{requests().length}}</strong><small>Waiting for your response</small></div><div><span>Created matches</span><strong>{{stats().created}}</strong><small>Hosted by you</small></div><div><span>Friends</span><strong>{{stats().friends}}</strong><small>Your sports community</small></div><div class="activity-metric"><span class="activity-ring" [style.--progress]="completionProgress()+'%'"><b>{{stats().completed}}</b></span><span><strong>Matches played</strong><small>Completed activities</small></span></div></div>
  <section class="form-card"><div class="section-heading"><h2>Pending join requests</h2><a routerLink="/matches">View matches</a></div>
    @if(loading()){<p>Loading requests…</p>}
    @else if(error()){<div class="alert error">{{error()}}</div><button class="button secondary" (click)="load()">Try again</button>}
    @else if(requests().length){@for(request of requests();track request.id){<div class="request-row"><span class="avatar">{{request.initials}}</span><span><strong>{{request.playerName}}</strong><small>Wants to join {{request.matchTitle}}</small></span><div><button class="button secondary" type="button" [disabled]="processing()===request.id" (click)="decline(request)">{{processing()===request.id?'Working…':'Decline'}}</button><button class="button primary" type="button" [disabled]="processing()===request.id" (click)="accept(request)">{{processing()===request.id?'Working…':'Accept'}}</button></div></div>}}
    @else{<div class="empty-state"><h2>No pending requests</h2><p>New requests for matches you host will appear here.</p></div>}
    @if(message()){<div class="alert success" role="status">{{message()}}</div>}
  </section>
`})
export class DashboardPage implements OnInit{
  private readonly repository=inject(MatchRepository);private readonly auth=inject(AuthService);private readonly supabase=inject(SupabaseService);readonly requests=signal<HostedRequest[]>([]);readonly stats=signal({created:0,friends:0,completed:0,joined:0});readonly profileReady=signal(false);readonly loading=signal(true);readonly error=signal('');readonly message=signal('');readonly processing=signal('');readonly completionProgress=()=>Math.min(100,Math.round(this.stats().completed/Math.max(1,this.stats().joined)*100));
  ngOnInit(){void this.load();}
  async load(){this.loading.set(true);this.error.set('');try{const [requests,stats]=await Promise.all([this.repository.pendingHostedRequests(),this.loadStats()]);this.requests.set(requests);this.stats.set(stats);}catch(error){this.error.set(error instanceof Error?error.message:'Dashboard could not be loaded.');}finally{this.loading.set(false);}}
  private async loadStats(){const user=this.auth.user();if(!user)return{created:0,friends:0,completed:0,joined:0};const [createdResult,friendsResult,participantsResult,hostedCompletedResult,profileResult]=await Promise.all([this.supabase.client.from('matches').select('id',{count:'exact',head:true}).eq('host_id',user.id),this.supabase.client.from('friendships').select('user_id',{count:'exact',head:true}).or(`user_id.eq.${user.id},friend_id.eq.${user.id}`),this.supabase.client.from('match_participants').select('match_id').eq('user_id',user.id).is('removed_at',null),this.supabase.client.from('matches').select('id').eq('host_id',user.id).eq('status','completed'),this.supabase.client.from('profiles').select('location,biography,preferred_sports').eq('id',user.id).single()]);const firstError=createdResult.error??friendsResult.error??participantsResult.error??hostedCompletedResult.error??profileResult.error;if(firstError)throw firstError;const profile=profileResult.data;this.profileReady.set(!!(profile?.location||profile?.biography||(profile?.preferred_sports?.length??0)));const completedIds=new Set((hostedCompletedResult.data??[]).map(match=>match.id));const joinedIds=(participantsResult.data??[]).map(item=>item.match_id);if(joinedIds.length){const {data,error}=await this.supabase.client.from('matches').select('id').in('id',joinedIds).eq('status','completed');if(error)throw error;for(const match of data??[])completedIds.add(match.id);}return{created:createdResult.count??0,friends:friendsResult.count??0,completed:completedIds.size,joined:joinedIds.length};}
  async accept(request:HostedRequest){this.processing.set(request.id);this.message.set('');this.error.set('');try{await this.repository.acceptRequest(request.id);this.requests.update(items=>items.filter(item=>item.id!==request.id));this.message.set(`${request.playerName} has been added to ${request.matchTitle}.`);}catch(error){this.error.set(error instanceof Error?error.message:(error as {message?:string})?.message??'The request could not be accepted.');}finally{this.processing.set('');}}
  async decline(request:HostedRequest){if(!window.confirm(`Decline ${request.playerName}'s request to join ${request.matchTitle}?`))return;this.processing.set(request.id);this.message.set('');this.error.set('');try{await this.repository.rejectRequest(request.id);this.requests.update(items=>items.filter(item=>item.id!==request.id));this.message.set(`${request.playerName}'s request was declined.`);}catch(error){this.error.set(error instanceof Error?error.message:(error as {message?:string})?.message??'The request could not be declined.');}finally{this.processing.set('');}}
}
