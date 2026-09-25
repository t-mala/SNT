import { AsyncPipe } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap, tap } from 'rxjs';
import { StrapiService } from '../../core/services/strapi.service';
import { StrapiMedia } from '../../core/models/content.models';

type GallerySlide = {
  src: string;
  caption: string;
  alt: string;
};

@Component({
  selector: 'app-gallery-album-page',
  imports: [AsyncPipe, RouterLink],
  templateUrl: './gallery-album-page.component.html',
  styleUrl: './gallery-album-page.component.scss',
})
export class GalleryAlbumPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly strapi = inject(StrapiService);

  readonly slides = signal<GallerySlide[]>([]);
  readonly lightboxOpen = signal(false);
  readonly lightboxIndex = signal(0);

  readonly album$ = this.route.paramMap.pipe(
    map((params) => params.get('albumSlug') ?? ''),
    switchMap((slug) => this.strapi.getGalleryAlbumBySlug(slug)),
    tap((album) => {
      if (!album) {
        this.slides.set([]);
        return;
      }
      const next: GallerySlide[] = [];
      for (const item of album.images || []) {
        const src = this.mediaUrl(item.image);
        if (!src) {
          continue;
        }
        next.push({
          src,
          caption: item.caption?.trim() || '',
          alt: item.caption || album.title,
        });
      }
      this.slides.set(next);
    }),
  );

  mediaUrl(media?: StrapiMedia | null): string | null {
    return this.strapi.bestMediaUrl(media ?? null);
  }

  openLightbox(src: string): void {
    const index = this.slides().findIndex((s) => s.src === src);
    if (index < 0) {
      return;
    }
    this.lightboxIndex.set(index);
    this.lightboxOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
    document.body.style.overflow = '';
  }

  prev(): void {
    const total = this.slides().length;
    if (!total) {
      return;
    }
    this.lightboxIndex.update((i) => (i - 1 + total) % total);
  }

  next(): void {
    const total = this.slides().length;
    if (!total) {
      return;
    }
    this.lightboxIndex.update((i) => (i + 1) % total);
  }

  currentSlide(): GallerySlide | null {
    return this.slides()[this.lightboxIndex()] ?? null;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.lightboxOpen()) {
      return;
    }
    if (event.key === 'Escape') {
      this.closeLightbox();
    } else if (event.key === 'ArrowLeft') {
      this.prev();
    } else if (event.key === 'ArrowRight') {
      this.next();
    }
  }
}
