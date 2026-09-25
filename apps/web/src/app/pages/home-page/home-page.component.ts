import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContactLinksService } from '../../core/services/contact-links.service';
import { StrapiService } from '../../core/services/strapi.service';
import { categoryImage } from '../../core/category-images';
import { StrapiMedia } from '../../core/models/content.models';

@Component({
  selector: 'app-home-page',
  imports: [AsyncPipe, RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  private readonly strapi = inject(StrapiService);
  readonly contact = inject(ContactLinksService);
  readonly page$ = this.strapi.getHomePage();
  readonly categories$ = this.strapi.getCategories();
  readonly categoryImage = categoryImage;

  heroImageUrl(mediaOrPath?: StrapiMedia | string | null): string {
    if (mediaOrPath && typeof mediaOrPath === 'object') {
      return this.strapi.bestMediaUrl(mediaOrPath) || '/images/hero.jpg';
    }
    return this.strapi.mediaUrl(mediaOrPath) || '/images/hero.jpg';
  }

  padIndex(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }

  shortDesc(text: string): string {
    const clean = text.trim();
    if (clean.length <= 110) {
      return clean;
    }
    return `${clean.slice(0, 107).trim()}…`;
  }
}
