import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AboutPage,
  ContactPage,
  FaqItem,
  FaqPage,
  GalleryAlbum,
  HomePage,
  Procedure,
  ProcedureCategory,
  SiteSetting,
  StrapiListResponse,
  StrapiMedia,
  StrapiMediaFormat,
  StrapiSingleResponse,
  WithStrapiMeta,
} from '../models/content.models';

@Injectable({ providedIn: 'root' })
export class StrapiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  readonly mediaBaseUrl = environment.strapiUrl;

  getSiteSettings(): Observable<WithStrapiMeta<SiteSetting> | null> {
    return this.getSingle<SiteSetting>('site-setting', {
      populate: 'logo',
    });
  }

  getHomePage(): Observable<WithStrapiMeta<HomePage> | null> {
    return this.getSingle<HomePage>('home-page', {
      populate: 'heroImage',
    });
  }

  getAboutPage(): Observable<WithStrapiMeta<AboutPage> | null> {
    return this.getSingle<AboutPage>('about-page', {
      populate: 'photo',
    });
  }

  getContactPage(): Observable<WithStrapiMeta<ContactPage> | null> {
    return this.getSingle<ContactPage>('contact-page');
  }

  getFaqPage(): Observable<WithStrapiMeta<FaqPage> | null> {
    return this.getSingle<FaqPage>('faq-page');
  }

  getCategories(): Observable<WithStrapiMeta<ProcedureCategory>[]> {
    return this.getMany<ProcedureCategory>('procedure-categories', {
      'populate[procedures][populate]': 'coverImage',
      'populate[procedures][sort][0]': 'order:asc',
      sort: 'order:asc',
    });
  }

  getCategoryBySlug(slug: string): Observable<WithStrapiMeta<ProcedureCategory> | null> {
    return this.getMany<ProcedureCategory>('procedure-categories', {
      'filters[slug][$eq]': slug,
      'populate[procedures][populate]': 'coverImage',
      'populate[procedures][sort][0]': 'order:asc',
      'populate[coverImage]': 'true',
    }).pipe(map((items) => items[0] ?? null));
  }

  getProcedureBySlug(slug: string): Observable<WithStrapiMeta<Procedure> | null> {
    return this.getMany<Procedure>('procedures', {
      'filters[slug][$eq]': slug,
      'populate[coverImage]': 'true',
      'populate[galleryImages]': 'true',
      'populate[category]': 'true',
    }).pipe(map((items) => items[0] ?? null));
  }

  getGalleryAlbums(): Observable<WithStrapiMeta<GalleryAlbum>[]> {
    return this.getMany<GalleryAlbum>('gallery-albums', {
      'populate[images][populate]': 'image',
      'populate[images][sort][0]': 'order:asc',
      sort: 'order:asc',
    });
  }

  getGalleryAlbumBySlug(slug: string): Observable<WithStrapiMeta<GalleryAlbum> | null> {
    return this.getMany<GalleryAlbum>('gallery-albums', {
      'filters[slug][$eq]': slug,
      'populate[images][populate]': 'image',
      'populate[images][sort][0]': 'order:asc',
    }).pipe(map((items) => items[0] ?? null));
  }

  getFaqItems(): Observable<WithStrapiMeta<FaqItem>[]> {
    return this.getMany<FaqItem>('faq-items', {
      sort: 'order:asc',
    });
  }

  mediaUrl(path?: string | null): string | null {
    if (!path) {
      return null;
    }
    if (path.startsWith('http')) {
      return path;
    }
    return `${this.mediaBaseUrl}${path}`;
  }

  /** Prefer the largest available Strapi media URL (original over thumbnail). */
  bestMediaUrl(media?: StrapiMedia | null): string | null {
    if (!media) {
      return null;
    }

    const candidates: Array<{ url: string; width: number }> = [];
    if (media.url) {
      candidates.push({ url: media.url, width: media.width ?? 0 });
    }

    const formats = media.formats ?? {};
    for (const format of Object.values(formats) as StrapiMediaFormat[]) {
      if (format?.url) {
        candidates.push({ url: format.url, width: format.width ?? 0 });
      }
    }

    candidates.sort((a, b) => b.width - a.width);
    return this.mediaUrl(candidates[0]?.url ?? media.url);
  }

  private getSingle<T>(
    endpoint: string,
    query: Record<string, string> = {},
  ): Observable<WithStrapiMeta<T> | null> {
    return this.http
      .get<StrapiSingleResponse<T>>(`${this.apiUrl}/${endpoint}`, {
        params: this.toParams(query),
      })
      .pipe(map((res) => res.data));
  }

  private getMany<T>(
    endpoint: string,
    query: Record<string, string> = {},
  ): Observable<WithStrapiMeta<T>[]> {
    return this.http
      .get<StrapiListResponse<T>>(`${this.apiUrl}/${endpoint}`, {
        params: this.toParams(query),
      })
      .pipe(map((res) => res.data ?? []));
  }

  private toParams(query: Record<string, string>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      params = params.set(key, value);
    }
    return params;
  }
}
