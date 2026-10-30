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

  /** Preferred topic order for the focused site. */
  private readonly topicOrder = ['Rinoplastie', 'Augmentarea mamară', 'Injectabile'];

  readonly topics = computed(() => {
    const groups = new Map<string, WithStrapiMeta<FaqItem>[]>();
    for (const item of this.items()) {
      const topic = item.topic?.trim() || 'Întrebări generale';
      const list = groups.get(topic) ?? [];
      list.push(item);
      groups.set(topic, list);
    }

    const ranked = [...groups.entries()].map(([name, items]) => ({
      name,
      id: this.topicId(name),
      items: [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    }));

    ranked.sort((a, b) => {
      const ai = this.topicOrder.indexOf(a.name);
      const bi = this.topicOrder.indexOf(b.name);
      const aRank = ai === -1 ? 999 : ai;
      const bRank = bi === -1 ? 999 : bi;
      if (aRank !== bRank) {
        return aRank - bRank;
      }
      return a.name.localeCompare(b.name, 'ro');
    });

    return ranked;
  });

  topicId(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
