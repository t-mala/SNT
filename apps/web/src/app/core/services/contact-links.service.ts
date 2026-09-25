import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { SiteSetting, WithStrapiMeta } from '../models/content.models';
import { StrapiService } from './strapi.service';

@Injectable({ providedIn: 'root' })
export class ContactLinksService {
  private readonly strapi = inject(StrapiService);

  readonly settings$: Observable<WithStrapiMeta<SiteSetting> | null> = this.strapi
    .getSiteSettings()
    .pipe(shareReplay(1));

  whatsappUrl(prefill = 'Bună ziua, doresc o programare.'): Observable<string | null> {
    return this.settings$.pipe(
      map((settings) => {
        if (!settings?.whatsappNumber) {
          return null;
        }
        const digits = settings.whatsappNumber.replace(/\D/g, '');
        return `https://wa.me/${digits}?text=${encodeURIComponent(prefill)}`;
      }),
    );
  }

  mailtoUrl(subject = 'Contact Dr. Tătulescu'): Observable<string | null> {
    return this.settings$.pipe(
      map((settings) => {
        if (!settings?.email) {
          return null;
        }
        return `mailto:${settings.email}?subject=${encodeURIComponent(subject)}`;
      }),
    );
  }

  telUrl(): Observable<string | null> {
    return this.settings$.pipe(
      map((settings) => {
        if (!settings?.phone) {
          return null;
        }
        const digits = settings.phone.replace(/[^\d+]/g, '');
        return `tel:${digits}`;
      }),
    );
  }
}
