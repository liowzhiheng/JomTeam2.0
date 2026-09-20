import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../core/supabase.service';

interface FeedbackItem { id:string; title:string; description:string; rating:number; status:string; created_at?:string }

@Component({selector:'app-feedback-page',imports:[ReactiveFormsModule,DatePipe],template:`
  <section class="page-heading"><div><p class="eyebrow">HELP US IMPROVE</p><h1>Platform feedback</h1><p>Tell us what works and what could be better.</p></div></section>
  <div class="editor-layout"><form class="form-card feedback-form" [formGroup]="form" (ngSubmit)="submit()"><h2>Send feedback</h2><label>Title<input formControlName="title" maxlength="120" placeholder="What would you like us to know?" /></label><label>Rating<select formControlName="rating"><option [ngValue]="5">5 — Excellent</option><option [ngValue]="4">4 — Good</option><option [ngValue]="3">3 — Okay</option><option [ngValue]="2">2 — Needs work</option><option [ngValue]="1">1 — Poor</option></select></label><label>Description<textarea rows="6" formControlName="description" maxlength="2000" placeholder="Share enough detail to help us improve."></textarea></label>@if(message()){<div class="alert success" role="status">{{message()}}</div>}@if(error()){<div class="alert error" role="alert">{{error()}}</div>}<button class="button primary" type="submit" [disabled]="submitting()">{{submitting()?'Sending…':'Send feedback'}}</button></form>
    <aside class="form-card"><h2>Your submissions</h2>@if(loading()){<p>Loading…</p>}@else{@for(item of items();track item.id){<div class="review"><div><span><strong>{{item.title}}</strong><small>{{item.rating}}/5 · {{item.status}} · {{item.created_at|date:'d MMM'}}</small></span></div><p>{{item.description}}</p></div>}@empty{<p>You have not submitted feedback yet.</p>}}</aside>
  </div>
`})
export class FeedbackPage implements OnInit{
  private readonly fb=inject(FormBuilder);private readonly supabase=inject(SupabaseService);readonly items=signal<FeedbackItem[]>([]);readonly loading=signal(true);readonly submitting=signal(false);readonly message=signal('');readonly error=signal('');readonly form=this.fb.nonNullable.group({title:['',[Validators.required,Validators.minLength(3),Validators.maxLength(120)]],rating:[5,[Validators.required,Validators.min(1),Validators.max(5)]],description:['',[Validators.required,Validators.minLength(3),Validators.maxLength(2000)]]});
  ngOnInit(){void this.load();}
  async load(){this.loading.set(true);const {data,error}=await this.supabase.client.from('feedback').select('id,title,description,rating,status,created_at').order('created_at',{ascending:false});if(!error)this.items.set(data??[]);this.loading.set(false);}
  async submit(){this.message.set('');this.error.set('');if(this.form.invalid){this.form.markAllAsTouched();this.error.set('Please complete every field.');return;}this.submitting.set(true);const {data,error}=await this.supabase.client.from('feedback').insert(this.form.getRawValue()).select('id,title,description,rating,status,created_at').single();if(error)this.error.set(error.message);else{this.items.update(items=>[data,...items]);this.form.reset({title:'',rating:5,description:''});this.message.set('Thank you. Your feedback has been submitted.');}this.submitting.set(false);}
}
