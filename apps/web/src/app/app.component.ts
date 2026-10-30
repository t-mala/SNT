import { ViewportScroller } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SiteHeaderComponent } from './layout/site-header/site-header.component';
import { SiteFooterComponent } from './layout/site-footer/site-footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly viewport = inject(ViewportScroller);

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (this.router.parseUrl(e.urlAfterRedirects).fragment) {
          return;
        }
        // Instant jump — CSS smooth scroll was cancelling / clamping mid-navigation
        this.scrollTop();
        requestAnimationFrame(() => this.scrollTop());
        setTimeout(() => this.scrollTop(), 50);
        setTimeout(() => this.scrollTop(), 150);
      });
  }

  private scrollTop(): void {
    this.viewport.scrollToPosition([0, 0]);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
}
