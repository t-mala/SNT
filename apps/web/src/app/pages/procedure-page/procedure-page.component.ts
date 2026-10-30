import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, defer, firstValueFrom, map, of, switchMap } from 'rxjs';
import { StrapiService } from '../../core/services/strapi.service';
import { GalleryAlbum, Procedure, WithStrapiMeta } from '../../core/models/content.models';
import { resolveFocusCategories } from '../../core/site-focus';
import { RichTextPipe } from '../../shared/rich-text.pipe';

type Slide = { src: string; alt: string };

/** Procedure slug → gallery album slug (results live under /galerie). */
const GALLERY_ALBUM_BY_PROCEDURE: Record<string, string> = {
  'rinoplastie-primara': 'rinoplastie-primara',
  'rinoplastie-secundara': 'rinoplastie-secundara',
  injectabile: 'injectabile',
  'augmentare-mamara': 'augmentare-mamara',
  // legacy
  rinoplastia: 'rinoplastie-primara',
  nechirurgicale: 'injectabile',
};

/** Prefer new album slug; fall back while CMS still uses legacy names. */
const GALLERY_ALBUM_FALLBACKS: Record<string, string[]> = {
  'rinoplastie-primara': ['rinoplastie-primara', 'rinoplastie'],
  'rinoplastie-secundara': ['rinoplastie-secundara', 'rinoplastie'],
  injectabile: ['injectabile'],
  'augmentare-mamara': ['augmentare-mamara'],
};

@Component({
  selector: 'app-procedure-page',
  imports: [AsyncPipe, RouterLink, RichTextPipe],
  templateUrl: './procedure-page.component.html',
  styleUrl: './procedure-page.component.scss',
})
export class ProcedurePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly strapi = inject(StrapiService);

  readonly slides = signal<Slide[]>([]);
  readonly galleryAlbumSlug = signal<string | null>(null);

  readonly procedure$ = this.route.paramMap.pipe(
    map((params) => params.get('procedureSlug') ?? ''),
    switchMap((slug) => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      const preferredAlbum = GALLERY_ALBUM_BY_PROCEDURE[slug] ?? null;
      this.galleryAlbumSlug.set(preferredAlbum);
      this.slides.set([]);

      return this.resolveProcedure(slug).pipe(
        switchMap((procedure) => {
          if (!procedure || !preferredAlbum) {
            return of(procedure);
          }
          return this.loadGallery(preferredAlbum, procedure);
        }),
      );
    }),
  );

  private resolveProcedure(slug: string): Observable<WithStrapiMeta<Procedure> | null> {
    return this.strapi.getProcedureBySlug(slug).pipe(
      switchMap((procedure) => {
        if (procedure) {
          return of(procedure);
        }
        return this.strapi.getCategories().pipe(
          map((categories) => {
            for (const category of resolveFocusCategories(categories)) {
              const match = (category.procedures || []).find((p) => p.slug === slug);
              if (match) {
                return {
                  ...match,
                  category,
                } as WithStrapiMeta<Procedure>;
              }
            }
            return null;
          }),
        );
      }),
    );
  }

  private loadGallery(
    preferredAlbum: string,
    procedure: WithStrapiMeta<Procedure>,
  ): Observable<WithStrapiMeta<Procedure>> {
    const candidates = GALLERY_ALBUM_FALLBACKS[preferredAlbum] ?? [preferredAlbum];

    return defer(async () => {
      for (const albumSlug of candidates) {
        const album = await firstValueFrom(this.strapi.getGalleryAlbumBySlug(albumSlug));
        if (album && (album.images || []).length) {
          this.applyAlbumSlides(album, procedure);
          return procedure;
        }
      }
      this.slides.set([]);
      return procedure;
    });
  }

  private applyAlbumSlides(
    album: WithStrapiMeta<GalleryAlbum>,
    procedure: WithStrapiMeta<Procedure>,
  ): void {
    this.galleryAlbumSlug.set(album.slug);
    const next: Slide[] = [];
    for (const item of album.images || []) {
      const src = this.strapi.bestMediaUrl(item.image ?? null);
      if (src) {
        next.push({ src, alt: item.caption || album.title || procedure.title });
      }
    }
    this.slides.set(next);
  }

  previewSlides(): Slide[] {
    return this.slides().slice(0, 3);
  }

  galleryLink(): string[] | null {
    const album = this.galleryAlbumSlug();
    return album ? ['/galerie', album] : null;
  }
}
