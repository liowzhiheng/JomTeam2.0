import { DatePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faBasketball, faFutbol, faPersonRunning, faTableTennisPaddleBall } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../core/auth.service';
import { MatchRepository } from '../../core/match.repository';
import { MatchSummary } from '../../core/models';
import { SupabaseService } from '../../core/supabase.service';
import { MatchCard } from '../../shared/match-card';
import { ImageService } from '../../core/image.service';

@Component({selector:'app-home-page',imports:[RouterLink,MatchCard,FontAwesomeModule,DatePipe,TitleCasePipe,UpperCasePipe],template:`
  <section class="welcome-row"><div><p class="eyebrow">{{today|date:'EEEE, d MMMM'}}</p><h1>{{greeting()}}, {{firstName()}}.</h1><p>Your next game is closer than you think.</p></div><a class="text-link" routerLink="/matches">See all matches <fa-icon [icon]="arrow" /></a></section>
  @if(loading()){<section class="spotlight-card"><div class="spotlight-copy"><h2>Loading your next match…</h2></div></section>}
  @else if(nextMatch();as match){<section class="spotlight-card"><div class="spotlight-copy"><span class="live-pill">NEXT UP · {{match.startsAt|date:'EEE, d MMM'|uppercase}}</span><h2>{{match.title}}</h2><p>{{match.startsAt|date:'h:mm a'}} · {{match.location}} · {{match.skillLevel|titlecase}}</p><div class="player-stack"><span>@if(match.hostAvatarUrl){<img [src]="avatarUrl(match.hostAvatarUrl)" [alt]="match.hostName+' profile photo'"/>}@else{{{initials(match.hostName)}}}</span><span class="more">{{match.participantCount}}/{{match.maxPlayers}}</span></div><div class="spotlight-actions"><a class="button light" [routerLink]="['/matches',match.id]">View details</a><a class="button ghost-light" [routerLink]="['/matches',match.id,'chat']">Open chat</a></div></div><div class="court-art" aria-hidden="true"><div class="court-line vertical"></div><div class="court-line horizontal"></div><div class="shuttle">●</div></div></section>}
  @else{<section class="spotlight-card"><div class="spotlight-copy"><span class="live-pill">READY TO PLAY?</span><h2>No upcoming match yet</h2><p>Explore open games and meet your next teammates.</p><div class="spotlight-actions"><a class="button light" routerLink="/matches">Find a match</a><a class="button ghost-light" routerLink="/matches/create">Create one</a></div></div><div class="court-art" aria-hidden="true"><div class="court-line vertical"></div><div class="court-line horizontal"></div></div></section>}
  <section class="section-block"><div class="section-heading"><div><h2>Find your game</h2><p>Explore activities around Malaysia.</p></div></div><div class="sport-strip">@for(sport of sports;track sport.name){<a routerLink="/matches" [queryParams]="{sport:sport.name}" class="sport-chip"><span><fa-icon [icon]="sport.icon" /></span>{{sport.name}}</a>}</div></section>
  <section class="section-block"><div class="section-heading"><div><h2>Open matches</h2><p>Upcoming games with places available.</p></div><a class="text-link" routerLink="/matches">Browse all <fa-icon [icon]="arrow" /></a></div>@if(error()){<div class="alert error">{{error()}}</div>}@else if(matches().length){<div class="match-grid">@for(match of matches();track match.id){<app-match-card [match]="match" />}</div>}@else if(!loading()){<div class="empty-state"><h2>No open matches right now</h2><a class="button primary" routerLink="/matches/create">Create a match</a></div>}</section>
`})
export class HomePage implements OnInit{
  private readonly auth=inject(AuthService);private readonly supabase=inject(SupabaseService);private readonly repository=inject(MatchRepository);private readonly images=inject(ImageService);
  readonly arrow=faArrowRight;readonly today=new Date();readonly firstName=signal('Player');readonly nextMatch=signal<MatchSummary|null>(null);readonly matches=signal<MatchSummary[]>([]);readonly loading=signal(true);readonly error=signal('');
  readonly sports=[{name:'Badminton',icon:faTableTennisPaddleBall},{name:'Football',icon:faFutbol},{name:'Basketball',icon:faBasketball},{name:'Running',icon:faPersonRunning},{name:'Table Tennis',icon:faTableTennisPaddleBall}];
  async ngOnInit(){const user=this.auth.user();if(!user)return;try{const [profile,next,popular]=await Promise.all([this.supabase.client.from('profiles').select('first_name').eq('id',user.id).single(),this.repository.upcomingForUser(),this.repository.search({status:'open',sort:'soonest',page:1,pageSize:3})]);if(profile.error)throw profile.error;this.firstName.set(profile.data.first_name);this.nextMatch.set(next);this.matches.set(popular.items);}catch(error){this.error.set((error as {message?:string})?.message??'Home could not be loaded.');}finally{this.loading.set(false);}}
  greeting(){const hour=new Date().getHours();return hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';}
  initials(name:string){return name.split(' ').map(part=>part[0]).slice(0,2).join('').toUpperCase();}
  avatarUrl(path:string){return this.images.publicUrl('avatars',path);}
}
