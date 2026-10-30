import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { StrapiService } from '../../core/services/strapi.service';
import { GalleryAlbum, GalleryImage, WithStrapiMeta } from '../../core/models/content.models';
import { isFocusGalleryAlbum } from '../../core/site-focus';

@Component({
  selector: 'app-gallery-page',
  imports: [AsyncPipe, RouterLink],
  templateUrl: './gallery-page.component.html',
  styleUrl: './gallery-page.component.scss',
})
export class GalleryPageComponent {
  private readonly strapi = inject(StrapiService);
  /** Focus albums only; hide empty ones until photos are uploaded. */
  readonly albums$ = this.strapi.getGalleryAlbums().pipe(
    map((albums) => {
      const focused = albums.filter(
        (album) =>
          (isFocusGalleryAlbum(album.slug) || album.slug === 'rinoplastie') &&
          (album.images?.length ?? 0) > 0,
      );
      // Prefer renamed primary album; keep legacy `rinoplastie` only if primary missing
      const hasPrimary = focused.some((a) => a.slug === 'rinoplastie-primara');
      return focused.filter((a) => a.slug !== 'rinoplastie' || !hasPrimary);
    }),
  );

  coverUrl(album: WithStrapiMeta<GalleryAlbum>): string | null {
    const first = (album.images || [])[0] as WithStrapiMeta<GalleryImage> | undefined;
    return this.strapi.bestMediaUrl(first?.image ?? null);
  }

  photoCount(album: WithStrapiMeta<GalleryAlbum>): number {
    return album.images?.length ?? 0;
  }
}
