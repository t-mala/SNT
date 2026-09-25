import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { StrapiService } from '../../core/services/strapi.service';
import { RichTextPipe } from '../../shared/rich-text.pipe';

@Component({
  selector: 'app-about-page',
  imports: [AsyncPipe, RichTextPipe],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss',
})
export class AboutPageComponent {
  private readonly strapi = inject(StrapiService);
  readonly page$ = this.strapi.getAboutPage();

  photoUrl(path?: string | null): string {
    return this.strapi.mediaUrl(path) || '/images/surgeon.jpg';
  }
}
