import { AsyncPipe } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap, tap } from 'rxjs';
import { StrapiService } from '../../core/services/strapi.service';
import { RichTextPipe } from '../../shared/rich-text.pipe';
import { StrapiMedia } from '../../core/models/content.models';

type Slide = { src: string; alt: string };

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
  readonly lightboxOpen = signal(false);
  readonly lightboxIndex = signal(0);

  readonly procedure$ = this.route.paramMap.pipe(
    map((params) => params.get('procedureSlug') ?? ''),
    switchMap((slug) => this.strapi.getProcedureBySlug(slug)),
    tap((procedure) => {
      if (!procedure) {
        this.slides.set([]);
        return;
      }
      const next: Slide[] = [];
      for (const media of procedure.galleryImages || []) {
        const src = this.bestUrl(media);
        if (src) {
          next.push({ src, alt: procedure.title });
        }
      }
      this.slides.set(next);
    }),
  );

  mediaUrl(path?: string | null): string | null {
    return this.strapi.mediaUrl(path);
  }

  bestUrl(media?: StrapiMedia | null): string | null {
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
    if (!total) return;
    this.lightboxIndex.update((i) => (i - 1 + total) % total);
  }

  next(): void {
    const total = this.slides().length;
    if (!total) return;
    this.lightboxIndex.update((i) => (i + 1) % total);
  }

  currentSlide(): Slide | null {
    return this.slides()[this.lightboxIndex()] ?? null;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.lightboxOpen()) return;
    if (event.key === 'Escape') this.closeLightbox();
    else if (event.key === 'ArrowLeft') this.prev();
    else if (event.key === 'ArrowRight') this.next();
  }
}
