import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StrapiService } from '../../core/services/strapi.service';
import { GalleryAlbum, GalleryImage, WithStrapiMeta } from '../../core/models/content.models';

@Component({
  selector: 'app-gallery-page',
  imports: [AsyncPipe, RouterLink],
  templateUrl: './gallery-page.component.html',
  styleUrl: './gallery-page.component.scss',
})
export class GalleryPageComponent {
  private readonly strapi = inject(StrapiService);
  readonly albums$ = this.strapi.getGalleryAlbums();

  coverUrl(album: WithStrapiMeta<GalleryAlbum>): string | null {
    const first = (album.images || [])[0] as WithStrapiMeta<GalleryImage> | undefined;
    return this.strapi.bestMediaUrl(first?.image ?? null);
  }

  photoCount(album: WithStrapiMeta<GalleryAlbum>): number {
    return album.images?.length ?? 0;
  }
}
