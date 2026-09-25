import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { StrapiService } from '../../core/services/strapi.service';
import { categoryImage, procedureCardImage } from '../../core/category-images';

@Component({
  selector: 'app-category-page',
  imports: [AsyncPipe, RouterLink],
  templateUrl: './category-page.component.html',
  styleUrl: './category-page.component.scss',
})
export class CategoryPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly strapi = inject(StrapiService);

  readonly categoryImage = categoryImage;

  readonly category$ = this.route.paramMap.pipe(
    map((params) => params.get('categorySlug') ?? ''),
    switchMap((slug) => this.strapi.getCategoryBySlug(slug)),
  );

  procedureImage(
    procedureSlug?: string | null,
    _coverUrl?: string | null,
    categorySlug?: string | null,
  ): string {
    return procedureCardImage(procedureSlug, categorySlug);
  }

  padIndex(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }

  shortDesc(text: string): string {
    const clean = text.trim();
    if (clean.length <= 160) {
      return clean;
    }
    return `${clean.slice(0, 157).trim()}…`;
  }
}
