import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ContactLinksService } from '../../core/services/contact-links.service';
import { StrapiService } from '../../core/services/strapi.service';
import { CLINIC } from '../../core/clinic';

@Component({
  selector: 'app-contact-page',
  imports: [AsyncPipe],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.scss',
})
export class ContactPageComponent {
  private readonly strapi = inject(StrapiService);
  readonly contact = inject(ContactLinksService);
  readonly page$ = this.strapi.getContactPage();
  readonly clinic = CLINIC;
}
