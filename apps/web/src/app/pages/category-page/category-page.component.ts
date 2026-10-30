import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest, map, switchMap } from 'rxjs';
import { StrapiService } from '../../core/services/strapi.service';
import { categoryImage, procedureCardImage } from '../../core/category-images';
import { PatientGuide, patientGuideFor } from '../../core/patient-guide';
import { resolveFocusCategories } from '../../core/site-focus';

@Component({
  selector: 'app-category-page',
  imports: [AsyncPipe, RouterLink],
  templateUrl: './category-page.component.html',
  styleUrl: './category-page.component.scss',
})
export class CategoryPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly strapi = inject(StrapiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly categoryImage = categoryImage;

  readonly category$ = this.route.paramMap.pipe(
    map((params) => params.get('categorySlug') ?? ''),
    switchMap((slug) =>
      this.strapi.getCategories().pipe(
        map((categories) => resolveFocusCategories(categories).find((c) => c.slug === slug) ?? null),
      ),
    ),
  );

  constructor() {
    // Router anchor scrolling runs before async category HTML exists — scroll ourselves.
    // Without a fragment, always start at top when the category slug changes (component reuse).
    combineLatest([this.category$, this.route.fragment])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([category, fragment]) => {
        if (!category) {
          return;
        }
        if (fragment) {
          this.scrollToFragment(fragment);
          return;
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
  }

  procedureImage(
    procedureSlug?: string | null,
    _coverUrl?: string | null,
    categorySlug?: string | null,
  ): string {
    return procedureCardImage(procedureSlug, categorySlug);
  }

  guideFor(slug?: string | null): PatientGuide | null {
    return patientGuideFor(slug);
  }

  faqFragment(topic: string): string {
    return topic
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
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

  private scrollToFragment(fragment: string): void {
    let attempts = 0;
    const maxAttempts = 40;

    const tryScroll = () => {
      const el = document.getElementById(fragment);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (attempts++ < maxAttempts) {
        requestAnimationFrame(tryScroll);
      }
    };

    // Beat router scrollPositionRestoration: 'top' on first navigation
    setTimeout(tryScroll, 0);
    setTimeout(tryScroll, 80);
  }
}
