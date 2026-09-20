import { DatePipe, UpperCasePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Database } from '../../core/database.types';
import { SupabaseService } from '../../core/supabase.service';

type MatchRow = Database['public']['Tables']['matches']['Row'];
interface HistoryMatch extends MatchRow { relationship:'Hosted'|'Joined' }

@Component({selector:'app-history-page',imports:[DatePipe,UpperCasePipe,RouterLink],template:`
  <section class="page-heading"><div><p class="eyebrow">YOUR GAMES</p><h1>Match history</h1><p>Matches you have hosted or joined, kept in one place.</p></div></section>
  @if(loading()){<div class="empty-state"><h2>Loading your matches…</h2></div>}
  @else if(error()){<div class="alert error" role="alert">{{error()}}</div>}
  @else if(matches().length){
    <div class="form-card"><div class="timeline-list">@for(match of matches();track match.id){
      <div><span class="date-block"><strong>{{match.starts_at|date:'dd'}}</strong><small>{{match.starts_at|date:'MMM'|uppercase}}</small></span><span><a [routerLink]="['/matches',match.id]"><strong>{{match.title}}</strong></a><small>{{match.relationship}} · {{match.sport}} · {{match.location}} · {{match.participant_count}}/{{match.max_players}} players</small></span><span class="status-badge" [class.open]="displayStatus(match)==='upcoming'" [class.cancelled]="displayStatus(match)==='cancelled'" [class.completed]="displayStatus(match)==='completed'">{{displayStatus(match)}}</span></div>
    }</div></div>
  }@else{<div class="empty-state"><h2>No matches yet</h2><p>Create a match or join one from Discover, and it will appear here.</p><a class="button primary" routerLink="/matches">Discover matches</a></div>}
`})
export class HistoryPage implements OnInit{
  private readonly auth=inject(AuthService);private readonly supabase=inject(SupabaseService);
  readonly matches=signal<HistoryMatch[]>([]);readonly loading=signal(true);readonly error=signal('');
  async ngOnInit(){const user=this.auth.user();if(!user){this.loading.set(false);return;}const {data:participants,error:participantError}=await this.supabase.client.from('match_participants').select('match_id,removed_at').eq('user_id',user.id).is('removed_at',null);if(participantError){this.error.set(participantError.message);this.loading.set(false);return;}const joinedIds=(participants??[]).map(item=>item.match_id);const hostedPromise=this.supabase.client.from('matches').select('*').eq('host_id',user.id);const joinedPromise=joinedIds.length?this.supabase.client.from('matches').select('*').in('id',joinedIds):Promise.resolve({data:[] as MatchRow[],error:null});const [hostedResult,joinedResult]=await Promise.all([hostedPromise,joinedPromise]);const queryError=hostedResult.error??joinedResult.error;if(queryError){this.error.set(queryError.message);this.loading.set(false);return;}const combined=new Map<string,HistoryMatch>();for(const match of hostedResult.data??[])combined.set(match.id,{...match,relationship:'Hosted'});for(const match of joinedResult.data??[])if(!combined.has(match.id))combined.set(match.id,{...match,relationship:'Joined'});this.matches.set([...combined.values()].sort((a,b)=>new Date(b.starts_at).getTime()-new Date(a.starts_at).getTime()));this.loading.set(false);}
  displayStatus(match:MatchRow){if(match.status==='cancelled')return'cancelled';if(match.status==='completed'||new Date(match.starts_at).getTime()<Date.now())return'completed';return'upcoming';}
}
