import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
@Injectable({providedIn:'root'})
export class ImageService {
  private readonly supabase=inject(SupabaseService); private readonly allowed=['image/jpeg','image/png','image/webp'];
  async compress(file:File,maxDimension=1600,quality=.82):Promise<Blob>{if(!this.allowed.includes(file.type))throw new Error('Choose a JPEG, PNG, or WebP image.');if(file.size>5*1024*1024)throw new Error('Image must be 5 MB or smaller.');const image=await createImageBitmap(file);const scale=Math.min(1,maxDimension/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext('2d')!.drawImage(image,0,0,canvas.width,canvas.height);image.close();return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Image processing failed.')),file.type==='image/png'?'image/png':'image/webp',quality));}
  async upload(bucket:'avatars'|'match-covers',folderId:string,file:File,onProgress?:(percent:number)=>void){onProgress?.(15);const blob=await this.compress(file);onProgress?.(55);const ext=blob.type==='image/png'?'png':'webp';const path=`${folderId}/${crypto.randomUUID()}.${ext}`;const {error}=await this.supabase.client.storage.from(bucket).upload(path,blob,{contentType:blob.type,upsert:false});if(error)throw error;onProgress?.(100);return path;}
  publicUrl(bucket:'avatars'|'match-covers',path:string|null|undefined){return path?this.supabase.client.storage.from(bucket).getPublicUrl(path).data.publicUrl:null;}
  async remove(bucket:'avatars'|'match-covers',path:string|null|undefined){if(!path)return;const{error}=await this.supabase.client.storage.from(bucket).remove([path]);if(error)throw error;}
}
