import { AsyncPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { StrapiService } from '../../core/services/strapi.service';
import { FaqItem, WithStrapiMeta } from '../../core/models/content.models';
import { RichTextPipe } from '../../shared/rich-text.pipe';

@Component({
  selector: 'app-faq-page',
  imports: [AsyncPipe, RichTextPipe],
  templateUrl: './faq-page.component.html',
  styleUrl: './faq-page.component.scss',
})
export class FaqPageComponent {
  private readonly strapi = inject(StrapiService);
  readonly page$ = this.strapi.getFaqPage();
  private readonly items = toSignal(this.strapi.getFaqItems(), {
    initialValue: [] as WithStrapiMeta<FaqItem>[],
  });

  readonly topics = computed(() => {
    const groups = new Map<string, WithStrapiMeta<FaqItem>[]>();
    for (const item of this.items()) {
      const topic = item.topic?.trim() || 'Întrebări generale';
      const list = groups.get(topic) ?? [];
      list.push(item);
      groups.set(topic, list);
    }
    return [...groups.entries()].map(([name, items]) => ({
      name,
      items: [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    }));
  });
}
