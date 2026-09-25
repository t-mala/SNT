import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ContactLinksService } from '../../core/services/contact-links.service';

@Component({
  selector: 'app-site-footer',
  imports: [AsyncPipe],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.scss',
})
export class SiteFooterComponent {
  readonly contact = inject(ContactLinksService);
}
