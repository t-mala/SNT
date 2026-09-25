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

    const mediaBase = environment.strapiUrl.replace(/\/$/, '');
    html = html.replace(
      /(src=["'])(\/uploads\/[^"']+)(["'])/gi,
      `$1${mediaBase}$2$3`,
    );

    html = normalizeProcedureMedia(html);

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}

function normalizeProcedureMedia(html: string): string {
  let out = tidyProcedureCopy(html);

  out = out.replace(/<p>\s*<p>/gi, '<p>');
  out = out.replace(/<\/p>\s*<\/p>/gi, '</p>');
  out = out.replace(/<!--\s*mai departe\s*-->/gi, '');

  out = out.replace(/<p>((?:\s*<img\b[^>]*>\s*){2,})<\/p>/gi, (_m, inner: string) => {
    const imgs = inner.match(/<img\b[^>]*>/gi) ?? [];
    return imgs.map((img) => wrapImg(img)).join('\n');
  });

  out = out.replace(/<p>\s*(<img\b[^>]*>)\s*<\/p>/gi, (_m, img: string) => wrapImg(img));

  out = out.replace(
    /<figure(?![^>]*proc-figure)([^>]*)>/gi,
    '<figure class="proc-figure"$1>',
  );

  out = out.replace(
    /<figure class="proc-figure">(\s*<img\b[^>]*\.(?:png|PNG)[^>]*>)/g,
    '<figure class="proc-figure proc-figure--diagram">$1',
  );

  out = pairIncisionFigures(out);

  // Shared heading above incision pairs → drop (each pair has its own label)
  out = out.replace(
    /<h2[^>]*>\s*Incizia inframamara[\s\S]*?<\/h2>\s*(?=<div class="proc-incision)/gi,
    '',
  );

  out = upgradeRinoIncisionDiagram(out);
  out = pairImplantFigures(out);

  return out;
}

/** Fix WP copy: nbsp gaps, empty breaks, loose paragraphs. */
function tidyProcedureCopy(html: string): string {
  let out = html;

  // Non-breaking spaces → normal (WP loves these between sentences)
  out = out.replace(/&nbsp;|&#160;|\u00a0/gi, ' ');

  // Soft breaks mid-paragraph → space; double breaks → paragraph split later
  out = out.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '</p><p>');
  out = out.replace(/<br\s*\/?>/gi, ' ');

  // Empty / whitespace-only paragraphs
  out = out.replace(/<p>(?:\s|&nbsp;|&#160;)*<\/p>/gi, '');

  // Collapse runs of spaces/tabs inside text (not across tags)
  out = out.replace(/[^\S\n]{2,}/g, ' ');

  // Trim inside paragraphs and headings
  out = out.replace(
    /<(p|h2|h3|li|figcaption)(\b[^>]*)>([\s\S]*?)<\/\1>/gi,
    (_m, tag: string, attrs: string, inner: string) => {
      const cleaned = inner.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
      if (!cleaned) {
        return '';
      }
      return `<${tag}${attrs}>${cleaned}</${tag}>`;
    },
  );

  // Too many blank lines between blocks
  out = out.replace(/(<\/p>)\s+(<p\b)/gi, '$1\n$2');
  out = out.replace(/(<\/h2>)\s+(<p\b)/gi, '$1\n$2');
  out = out.replace(/\n{3,}/g, '\n\n');

  // WP often splits words across <strong>/<b>: <strong>X</strong><b> y</b>z
  out = out.replace(/<b>([\s\S]*?)<\/b>/gi, '$1');
  out = out.replace(/<\/?b>/gi, '');

  // WP section titles were often just bold paragraphs → real headings
  out = out.replace(
    /<p>\s*<strong>([\s\S]*?)<\/strong>\s*<\/p>/gi,
    (_m, title: string) => {
      const text = title.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (!text || text.length > 70 || /[.!?]$/.test(text)) {
        return _m;
      }
      return `<h3>${text}</h3>`;
    },
  );

  return out;
}

function wrapImg(img: string): string {
  const diagram = /\.(?:png|PNG)/.test(img);
  const cls = diagram ? 'proc-figure proc-figure--diagram' : 'proc-figure';
  return `<figure class="${cls}">${img}</figure>`;
}

type IncisionKey = 'inframam' | 'periareolar';

const INCISION_LABELS: Record<IncisionKey, string> = {
  inframam: 'Incizia inframamară',
  periareolar: 'Incizia periareolară',
};

/** Pair diagram PNGs with matching clinical photos (by incision type in filename). */
function pairIncisionFigures(html: string): string {
  const figureRe = /<figure class="proc-figure[^"]*">[\s\S]*?<\/figure>/gi;
  const figures = [...html.matchAll(figureRe)];
  if (figures.length < 2) {
    return html;
  }

  type Item = {
    html: string;
    index: number;
    end: number;
    key: IncisionKey | null;
    diagram: boolean;
  };

  const items: Item[] = figures.map((m) => {
    const tag = m[0];
    return {
      html: tag,
      index: m.index ?? 0,
      end: (m.index ?? 0) + tag.length,
      key: incisionKey(tag),
      diagram: /proc-figure--diagram|\.png/i.test(tag),
    };
  });

  // Only consecutive figure runs (whitespace between)
  const used = new Set<number>();
  const replacements: { start: number; end: number; html: string }[] = [];

  let i = 0;
  while (i < items.length) {
    let j = i + 1;
    while (j < items.length) {
      const between = html.slice(items[j - 1].end, items[j].index);
      if (between.trim() !== '') {
        break;
      }
      j++;
    }

    const run = items.slice(i, j);
    if (run.length >= 2) {
      const paired = buildIncisionPairs(run);
      if (paired) {
        run.forEach((_, offset) => used.add(i + offset));
        replacements.push({
          start: run[0].index,
          end: run[run.length - 1].end,
          html: paired,
        });
      }
    }
    i = j;
  }

  if (!replacements.length) {
    return html;
  }

  let out = html;
  for (const rep of replacements.sort((a, b) => b.start - a.start)) {
    out = out.slice(0, rep.start) + rep.html + out.slice(rep.end);
  }
  return out;
}

function buildIncisionPairs(run: { html: string; key: IncisionKey | null; diagram: boolean }[]): string | null {
  const diagrams = new Map<IncisionKey, string>();
  const photos = new Map<IncisionKey, string>();

  for (const item of run) {
    if (!item.key) {
      return null;
    }
    if (item.diagram) {
      diagrams.set(item.key, item.html);
    } else {
      photos.set(item.key, item.html);
    }
  }

  const keys = [...diagrams.keys()].filter((k) => photos.has(k));
  if (!keys.length || keys.length * 2 !== run.length) {
    return null;
  }

  // Stable order: inframam first, then periareolar
  const order: IncisionKey[] = ['inframam', 'periareolar'];
  const sorted = order.filter((k) => keys.includes(k));

  return sorted
    .map((key) => {
      const diagram = tagFigure(diagrams.get(key)!, 'Schemă');
      const photo = tagFigure(photos.get(key)!, 'Clinic');
      const label = INCISION_LABELS[key];
      return `<div class="proc-incision">
  <p class="proc-incision__label">${label}</p>
  <div class="proc-incision__row">
    ${diagram}
    <span class="proc-incision__bridge" aria-hidden="true"></span>
    ${photo}
  </div>
</div>`;
    })
    .join('\n');
}

function tagFigure(figureHtml: string, tag: string): string {
  return figureHtml.replace(
    /^(<figure class="proc-figure[^"]*">)/i,
    `$1<span class="proc-incision__tag">${tag}</span>`,
  );
}

function incisionKey(figureHtml: string): IncisionKey | null {
  const src = figureHtml.match(/src=["']([^"']+)["']/i)?.[1] ?? '';
  const alt = figureHtml.match(/alt=["']([^"']*)["']/i)?.[1] ?? '';
  const hay = `${src} ${alt}`.toLowerCase();
  if (hay.includes('periareolar')) {
    return 'periareolar';
  }
  if (hay.includes('inframam')) {
    return 'inframam';
  }
  return null;
}

/** Original WP nose diagram + clinical columella photo. */
function upgradeRinoIncisionDiagram(html: string): string {
  const blockRe =
    /(?:<h2[^>]*>\s*Incizia pentru rinoplastia deschisa\s*<\/h2>\s*)?(<figure class="proc-figure[^"]*">[\s\S]*?nasexternincizie[\s\S]*?<\/figure>)/gi;

  return html.replace(blockRe, () => {
    const diagram = tagFigure(
      `<figure class="proc-figure proc-figure--diagram proc-figure--rino"><img src="/images/procedures/rino-incizie-schema.png" alt="Schemă incizie rinoplastie deschisă" /></figure>`,
      'Schemă',
    );
    const photo = tagFigure(
      `<figure class="proc-figure proc-figure--rino-clinic"><img src="/images/procedures/rino-incizie-clinic.jpg" alt="Incizie rinoplastie deschisă — aspect clinic" /></figure>`,
      'Clinic',
    );
    return `<div class="proc-incision">
  <p class="proc-incision__label">Incizia pentru rinoplastia deschisă</p>
  <div class="proc-incision__row">
    ${diagram}
    <span class="proc-incision__bridge" aria-hidden="true"></span>
    ${photo}
  </div>
</div>`;
  });
}

/** Product shots: cohesive gel + round/anatomic implants side by side. */
function pairImplantFigures(html: string): string {
  const blockRe =
    /<h2[^>]*>\s*Implant cu gel coeziv\s*<\/h2>\s*(<figure class="proc-figure[^"]*">[\s\S]*?coeziv[\s\S]*?<\/figure>)\s*(?:<p>[\s\S]*?<\/p>\s*)?<h2[^>]*>\s*Implanturi siliconice texturate[\s\S]*?<\/h2>\s*(?:<h2[^>]*>\s*\([\s\S]*?\)\s*<\/h2>\s*)?(<figure class="proc-figure[^"]*">[\s\S]*?rotundanatomic[\s\S]*?<\/figure>)/gi;

  return html.replace(blockRe, (_m, gelFig: string, shapeFig: string) => {
    const gel = tagFigure(gelFig, 'Gel');
    const shapes = tagFigure(shapeFig, 'Forme');
    return `<div class="proc-incision proc-incision--product">
  <p class="proc-incision__label">Implanturi mamare</p>
  <div class="proc-incision__row">
    ${gel}
    ${shapes}
  </div>
</div>
<p>Forma învelișului este cea care dictează forma implantului — rotund sau anatomic (în picătură).</p>`;
  });
}

