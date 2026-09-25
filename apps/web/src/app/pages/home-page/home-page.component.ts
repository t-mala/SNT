import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { map, startWith } from 'rxjs';
import { ContactLinksService } from '../../core/services/contact-links.service';
import { StrapiService } from '../../core/services/strapi.service';
import { categoryImage } from '../../core/category-images';
import { HomePage } from '../../core/models/content.models';

const HERO_FALLBACK: Pick<HomePage, 'heroTitle' | 'heroSubtitle'> = {
  heroTitle: 'Descoperă frumusețea',
  heroSubtitle: 'Chirurgie plastică, cu eleganță și precizie.',
};

@Component({
  selector: 'app-home-page',
  imports: [AsyncPipe, RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  private readonly strapi = inject(StrapiService);
  readonly contact = inject(ContactLinksService);
  /** Immediate fallback so hero DOM (and entrance animation) stays stable. */
  readonly page$ = this.strapi.getHomePage().pipe(
    map((page) => page ?? HERO_FALLBACK),
    startWith(HERO_FALLBACK),
  );
  readonly categories$ = this.strapi.getCategories();
  readonly categoryImage = categoryImage;

  /** Marketing hero — `apps/web/public/images/hero.jpg` */
  heroImageUrl(): string {
    return '/images/hero.jpg';
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
