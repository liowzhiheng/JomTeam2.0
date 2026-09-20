import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBell, faCalendarDays, faChevronDown, faCirclePlus, faCommentDots, faCompass, faHouse, faMoon, faRightFromBracket, faShieldHalved, faSun, faTableColumns, faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../core/auth.service';
import { SupabaseService } from '../core/supabase.service';
import { NotificationService } from '../core/notification.service';
import { ImageService } from '../core/image.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FontAwesomeModule],
  template: `
    <div class="app-frame" [class.dark]="dark()">
      <aside class="sidebar" aria-label="Main navigation">
        <a class="brand" routerLink="/home"><span class="brand-mark">JT</span><span>JomTeam</span></a>
        <nav>
          <a routerLink="/home" routerLinkActive="active"><fa-icon [icon]="icons.home" /> <span>Home</span></a>
          <a routerLink="/matches" routerLinkActive="active"><fa-icon [icon]="icons.compass" /> <span>Discover</span></a>
          <a routerLink="/dashboard" routerLinkActive="active"><fa-icon [icon]="icons.dashboard" /> <span>Dashboard</span></a>
          <a routerLink="/friends" routerLinkActive="active"><fa-icon [icon]="icons.friends" /> <span>Friends</span></a>
          <a routerLink="/history" routerLinkActive="active"><fa-icon [icon]="icons.calendar" /> <span>History</span></a>
          <a routerLink="/feedback" routerLinkActive="active"><fa-icon [icon]="icons.feedback" /> <span>Send feedback</span></a>
          @if (isAdmin()) {
            <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}"><fa-icon [icon]="icons.admin" /> <span>Admin</span></a>
            <a routerLink="/admin/users" routerLinkActive="active"><fa-icon [icon]="icons.friends" /> <span>User management</span></a>
            <a routerLink="/admin/matches" routerLinkActive="active"><fa-icon [icon]="icons.calendar" /> <span>Match management</span></a>
            <a routerLink="/admin/feedback" routerLinkActive="active"><fa-icon [icon]="icons.feedback" /> <span>Feedback management</span></a>
          }
        </nav>
        <div class="sidebar-bottom">
          <button class="nav-button" type="button" (click)="dark.set(!dark())" [attr.aria-label]="dark() ? 'Use light mode' : 'Use dark mode'">
            <fa-icon [icon]="dark() ? icons.sun : icons.moon" /><span>{{ dark() ? 'Light mode' : 'Dark mode' }}</span>
          </button>
          <button class="nav-button" type="button" (click)="logout()"><fa-icon [icon]="icons.logout" /><span>Sign out</span></button>
          <a class="profile-row" routerLink="/profile"><span class="avatar">@if(avatarUrl()){<img [src]="avatarUrl()!" alt="Your profile photo"/>}@else{<span>{{initials()}}</span>}</span><span><strong>{{displayName()}}</strong><small>{{skillLevel()}}</small></span><fa-icon [icon]="icons.chevron" /></a>
        </div>
      </aside>
      <main>
        <header class="topbar">
          <a class="mobile-brand" routerLink="/home"><span class="brand-mark">JT</span><strong>JomTeam</strong></a>
          <div class="topbar-actions">
            <a class="button primary create-button" routerLink="/matches/create"><fa-icon [icon]="icons.plus" /> Create match</a>
            <a class="icon-button notification-button" routerLink="/notifications" [attr.aria-label]="notifications.unreadCount() ? notifications.unreadCount() + ' unread notifications' : 'Notifications'"><fa-icon [icon]="icons.bell" />@if(notifications.unreadCount()){<span class="notification-dot"></span>}</a>
          </div>
        </header>
        <div class="content"><router-outlet /></div>
        <nav class="mobile-nav" aria-label="Mobile navigation">
          <a routerLink="/home" routerLinkActive="active"><fa-icon [icon]="icons.home" /><span>Home</span></a>
          <a routerLink="/matches" routerLinkActive="active"><fa-icon [icon]="icons.compass" /><span>Discover</span></a>
          <a routerLink="/matches/create"><span class="mobile-create"><fa-icon [icon]="icons.plus" /></span><span>Create</span></a>
          <a routerLink="/dashboard" routerLinkActive="active"><fa-icon [icon]="icons.dashboard" /><span>Dashboard</span></a>
          <a routerLink="/profile" routerLinkActive="active"><span class="mini-avatar">@if(avatarUrl()){<img [src]="avatarUrl()!" alt="Your profile photo"/>}@else{<span>{{initials()}}</span>}</span><span>Profile</span></a>
        </nav>
      </main>
    </div>
  `
})
export class AppShell implements OnInit,OnDestroy {
  private readonly auth = inject(AuthService); private readonly router = inject(Router);
  private readonly supabase=inject(SupabaseService);private readonly images=inject(ImageService);readonly notifications=inject(NotificationService);
  readonly dark = signal(localStorage.getItem('jomteam-theme') === 'dark');
  readonly isAdmin = computed(() => this.auth.role() === 'admin');
  readonly displayName=signal('Player');readonly skillLevel=signal('Member');readonly avatarUrl=signal<string|null>(null);readonly initials=computed(()=>this.displayName().split(' ').map(part=>part[0]).slice(0,2).join('').toUpperCase());
  readonly icons = { home: faHouse, compass: faCompass, dashboard: faTableColumns, friends: faUserGroup, calendar: faCalendarDays, admin: faShieldHalved, feedback: faCommentDots, plus: faCirclePlus, bell: faBell, moon: faMoon, sun: faSun, chevron: faChevronDown, logout: faRightFromBracket };
  private readonly profileUpdated=(event:Event)=>{const detail=(event as CustomEvent<{name:string;skill:string;avatarPath:string|null}>).detail;this.displayName.set(detail.name);this.skillLevel.set(detail.skill.replace('_',' '));this.avatarUrl.set(this.images.publicUrl('avatars',detail.avatarPath));};
  constructor(){this.dark.set(window.matchMedia('(prefers-color-scheme: dark)').matches&&!localStorage.getItem('jomteam-theme'));window.addEventListener('jomteam-profile-updated',this.profileUpdated);}
  async ngOnInit(){const user=this.auth.user();if(!user)return;await this.notifications.start(user.id);const {data}=await this.supabase.client.from('profiles').select('first_name,last_name,skill_level,profile_image_path').eq('id',user.id).single();if(data){this.displayName.set(`${data.first_name} ${data.last_name}`.trim());this.skillLevel.set(data.skill_level.replace('_',' '));this.avatarUrl.set(this.images.publicUrl('avatars',data.profile_image_path));}}
  async logout() { await this.notifications.stop();await this.auth.signOut(); await this.router.navigate(['/login']); }
  ngOnDestroy(){window.removeEventListener('jomteam-profile-updated',this.profileUpdated);}
}
