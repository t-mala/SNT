import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { filter } from 'rxjs/operators';
import { ContactLinksService } from '../../core/services/contact-links.service';
import { StrapiService } from '../../core/services/strapi.service';
import { ProcedureCategory, SiteSetting, WithStrapiMeta } from '../../core/models/content.models';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, AsyncPipe],
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.scss',
})
export class SiteHeaderComponent implements OnInit {
  private readonly strapi = inject(StrapiService);
  private readonly router = inject(Router);
  readonly contact = inject(ContactLinksService);

  settings = signal<WithStrapiMeta<SiteSetting> | null>(null);
  categories = signal<WithStrapiMeta<ProcedureCategory>[]>([]);
  menuOpen = signal(false);
  scrolled = signal(false);
  onHome = signal(false);

  /** White logo + glass header only while sitting on the home hero. */
  overHero = computed(() => this.onHome() && !this.scrolled());

  ngOnInit(): void {
    this.contact.settings$.subscribe((s) => this.settings.set(s));
    this.strapi.getCategories().subscribe((c) => this.categories.set(c));
    this.syncRoute(this.router.url);

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.syncRoute(e.urlAfterRedirects);
        this.menuOpen.set(false);
      });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 24);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  hasLogo(): boolean {
    return !!this.settings()?.logo?.url;
  }

  private syncRoute(url: string): void {
    const path = url.split('?')[0].replace(/\/$/, '') || '/';
    this.onHome.set(path === '/');
    this.scrolled.set(typeof window !== 'undefined' ? window.scrollY > 24 : false);
  }
}
