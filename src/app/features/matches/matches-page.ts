import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMagnifyingGlass, faSliders } from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute } from '@angular/router';
import { MatchSummary } from '../../core/models';
import { MatchRepository } from '../../core/match.repository';
import { MatchCard } from '../../shared/match-card';

@Component({ selector: 'app-matches-page', imports: [FormsModule, MatchCard, FontAwesomeModule], template: `
  <section class="page-heading"><div><p class="eyebrow">DISCOVER</p><h1>Find a match</h1><p>Search local sports and meet your next teammates.</p></div></section>
  <section class="filter-panel"><label class="search-field"><fa-icon [icon]="searchIcon" /><input [(ngModel)]="query" (keyup.enter)="applyFilters()" placeholder="Search matches or locations" aria-label="Search matches" /></label><button class="button secondary filter-button" type="button" (click)="applyFilters()"><fa-icon [icon]="filterIcon" /> Search</button>
    <div class="filter-row"><select [(ngModel)]="sport" (change)="applyFilters()" aria-label="Sport"><option value="">All sports</option>@for(s of sports;track s){<option [value]="s">{{s}}</option>}</select><select [(ngModel)]="skillLevel" (change)="applyFilters()" aria-label="Skill level"><option value="">Any skill</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="all_levels">All levels</option></select><input [(ngModel)]="date" (change)="applyFilters()" type="date" aria-label="Date"/><select [(ngModel)]="status" (change)="applyFilters()" aria-label="Match status"><option value="">All statuses</option><option value="open">Open</option><option value="full">Full</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><select [(ngModel)]="sort" (change)="applyFilters()" aria-label="Sort"><option value="soonest">Soonest first</option><option value="newest">Newest</option></select></div>
  </section>
  <div class="results-line"><strong>{{total()}} matches</strong><span>{{hasFilters()?'matching your filters':'across the community'}}</span></div>
  @if (loading()) { <div class="match-grid wide" aria-label="Loading matches">@for (_ of [1,2,3]; track _) { <div class="match-card"><div class="match-cover"></div><div class="match-body"><p>Loading match…</p></div></div> }</div> }
  @else if (error()) { <div class="empty-state"><h2>Matches could not be loaded</h2><p>{{ error() }}</p><button class="button secondary" (click)="load()">Try again</button></div> }
  @else if (matches().length) { <div class="match-grid wide">@for (match of matches(); track match.id) { <app-match-card [match]="match" /> }</div><nav class="pagination" aria-label="Pagination"><button [disabled]="page()===1" (click)="previous()">Previous</button><button class="current">{{page()}}</button><button [disabled]="page()*pageSize>=total()" (click)="next()">Next</button></nav> }
  @else { <div class="empty-state"><span class="empty-icon"><fa-icon [icon]="searchIcon" /></span><h2>No matches found</h2><p>Try a different sport, date, or location.</p><button class="button secondary" (click)="clearSearch()">Clear search</button></div> }
` })
export class MatchesPage implements OnInit {
  private readonly repository=inject(MatchRepository);private readonly route=inject(ActivatedRoute);
  readonly searchIcon=faMagnifyingGlass;readonly filterIcon=faSliders;readonly query=signal('');readonly sport=signal('');readonly skillLevel=signal('');readonly date=signal('');readonly status=signal('open');readonly sort=signal<'soonest'|'newest'>('soonest');
  readonly sports = ['Badminton','Basketball','Football','Futsal','Tennis','Volleyball','Running','Swimming','Table Tennis','Pickleball'];
  readonly matches=signal<MatchSummary[]>([]);readonly total=signal(0);readonly page=signal(1);readonly pageSize=12;readonly loading=signal(true);readonly error=signal('');
  ngOnInit(){const sport=this.route.snapshot.queryParamMap.get('sport');if(sport&&this.sports.includes(sport))this.sport.set(sport);void this.load();}
  async load(){this.loading.set(true);this.error.set('');try{const result=await this.repository.search({query:this.query().trim()||undefined,sport:this.sport()||undefined,skillLevel:this.skillLevel()||undefined,date:this.date()||undefined,status:this.status()||undefined,page:this.page(),pageSize:this.pageSize,sort:this.sort()});this.matches.set(result.items);this.total.set(result.total);}catch(error){this.error.set(error instanceof Error?error.message:'Please check your connection and try again.');}finally{this.loading.set(false);}}
  applyFilters(){this.page.set(1);void this.load();}
  hasFilters(){return!!(this.query().trim()||this.sport()||this.skillLevel()||this.date()||this.status());}
  previous(){if(this.page()>1){this.page.update(value=>value-1);void this.load();}}
  next(){if(this.page()*this.pageSize<this.total()){this.page.update(value=>value+1);void this.load();}}
  clearSearch(){this.query.set('');this.sport.set('');this.skillLevel.set('');this.date.set('');this.status.set('open');this.sort.set('soonest');this.page.set(1);void this.load();}
}
