import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContactLinksService } from '../../core/services/contact-links.service';

@Component({
  selector: 'app-site-footer',
  imports: [AsyncPipe, RouterLink],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.scss',
})
export class SiteFooterComponent {
  readonly contact = inject(ContactLinksService);
}
