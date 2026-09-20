import { Component, inject, input } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendarDays, faLocationDot, faUsers } from '@fortawesome/free-solid-svg-icons';
import { MatchSummary } from '../core/models';
import { ImageService } from '../core/image.service';

@Component({
  selector: 'app-match-card', imports: [DatePipe, TitleCasePipe, RouterLink, FontAwesomeModule],
  template: `
    <article class="match-card">
      <div class="match-cover" [class]="'match-cover sport-' + match().sport.toLowerCase().replace(' ', '-')" [style.background-image]="coverImage()">
        <span class="sport-label">{{ match().sport }}</span><span class="status-badge" [class]="match().status">{{ match().status | titlecase }}</span>
      </div>
      <div class="match-body">
        <div class="host"><span class="avatar small">{{ initials(match().hostName) }}</span><span>Hosted by <strong>{{ match().hostName }}</strong></span></div>
        <h3><a [routerLink]="['/matches', match().id]">{{ match().title }}</a></h3>
        <div class="match-meta"><span><fa-icon [icon]="icons.calendar" />{{ match().startsAt | date:'EEE, d MMM · h:mm a' }}</span><span><fa-icon [icon]="icons.location" />{{ match().location }}</span></div>
        <div class="match-footer"><span class="skill-pill">{{ match().skillLevel | titlecase }}</span><span class="capacity"><fa-icon [icon]="icons.users" />{{ match().participantCount }}/{{ match().maxPlayers }} players</span></div>
      </div>
    </article>
  `
})
export class MatchCard { private readonly images=inject(ImageService);readonly match=input.required<MatchSummary>();readonly icons={calendar:faCalendarDays,location:faLocationDot,users:faUsers};coverImage(){const url=this.images.publicUrl('match-covers',this.match().coverUrl);return url?`linear-gradient(rgba(8,35,65,.18),rgba(8,35,65,.18)), url("${url}")`:null;}initials(name:string){return name.split(' ').map(p=>p[0]).slice(0,2).join('');} }
