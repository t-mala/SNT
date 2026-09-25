import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, of, switchMap, tap } from 'rxjs';
import { StrapiService } from '../../core/services/strapi.service';
import { RichTextPipe } from '../../shared/rich-text.pipe';

type Slide = { src: string; alt: string };

/** Procedure slug → gallery album slug (results live under /galerie). */
const GALLERY_ALBUM_BY_PROCEDURE: Record<string, string> = {
  rinoplastia: 'rinoplastie',
  'augmentare-mamara': 'augmentare-mamara',
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
      const albumSlug = GALLERY_ALBUM_BY_PROCEDURE[slug] ?? null;
      this.galleryAlbumSlug.set(albumSlug);
      this.slides.set([]);

      return this.strapi.getProcedureBySlug(slug).pipe(
        switchMap((procedure) => {
          if (!procedure || !albumSlug) {
            return of(procedure);
          }
          return this.strapi.getGalleryAlbumBySlug(albumSlug).pipe(
            tap((album) => {
              if (!album) {
                this.slides.set([]);
                return;
              }
              const next: Slide[] = [];
              for (const item of album.images || []) {
                const src = this.strapi.bestMediaUrl(item.image ?? null);
                if (src) {
                  next.push({ src, alt: item.caption || album.title || procedure.title });
                }
              }
              this.slides.set(next);
            }),
            map(() => procedure),
          );
        }),
      );
    }),
  );

  previewSlides(): Slide[] {
    return this.slides().slice(0, 3);
  }

  galleryLink(): string[] | null {
    const album = this.galleryAlbumSlug();
    return album ? ['/galerie', album] : null;
  }
}
