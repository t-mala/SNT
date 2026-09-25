import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { environment } from '../../environments/environment';

@Pipe({ name: 'richText', standalone: true })
export class RichTextPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value?: string | null): SafeHtml {
    if (!value?.trim()) {
      return '';
    }

    const trimmed = value.trim();
    let html = trimmed.startsWith('<')
      ? trimmed
      : (marked.parse(trimmed, { async: false }) as string);

    // Body HTML from Strapi uses root-relative /uploads/... — point at CMS host
    const mediaBase = environment.strapiUrl.replace(/\/$/, '');
    html = html.replace(
      /(src=["'])(\/uploads\/[^"']+)(["'])/gi,
      `$1${mediaBase}$2$3`,
    );

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
