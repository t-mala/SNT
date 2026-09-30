/** Patient-facing guide + downloadable docs for focused categories. */

export type PatientDoc = {
  title: string;
  description?: string;
  /** Public path under `apps/web/public`, e.g. `/docs/rinoplastie/consimtamant.pdf` */
  href: string;
};

export type PatientGuideStep = {
  title: string;
  body: string;
  bullets?: string[];
  note?: string;
};

export type PatientGuide = {
  categorySlug: string;
  title: string;
  lede: string;
  steps: PatientGuideStep[];
  /** Consent / forms — empty until PDFs are dropped in public/docs */
  documents: PatientDoc[];
  faqTopic?: string;
};

export const PATIENT_GUIDES: Record<string, PatientGuide> = {
  rinoplastie: {
    categorySlug: 'rinoplastie',
    title: 'Ghidul pacientului',
    lede:
      'Ce se întâmplă înainte, în ziua operației și în recuperare — pe scurt, ca să știți la ce să vă așteptați.',
    steps: [
      {
        title: 'Înainte de operație',
        body:
          'În consult discutăm ce vă deranjează estetic sau funcțional și planul potrivit (primară sau secundară). Spuneți-ne dacă urmați un tratament care nu poate fi întrerupt. Puteți mânca până la miezul nopții dinaintea intervenției; apoi nu mai înghițiți nimic.',
      },
      {
        title: 'Analize și investigații',
        body: 'Analizele necesare sunt:',
        bullets: [
          'Grup sânge și Rh',
          'Hemogramă',
          'Uree, creatinină sangvină',
          'Transaminaze hepatice',
          'Glicemie',
          'Ionogramă (Na, K, Ca)',
          'Probe de coagulare (AP, APTT, INR)',
          'Anticorpi anti HIV, anti HVC (virus hepatitic C)',
          'Antigen HBs (virus hepatitic B)',
          'Exsudat nazal',
          'Fibroscopie nazală — filmați monitorul sau cereți înregistrarea video',
          'Consult cardiologie și EKG',
        ],
        note: 'Lista poate suferi modificări în funcție de particularitățile fiecărui caz.',
      },
      {
        title: 'Ziua operației',
        body:
          'Intervenția se face sub anestezie generală. Pentru majoritatea cazurilor folosesc tehnica rinoplastiei deschise (incizie pe columelă, care se vindecă discret). Nu se folosesc meșe: se plasează tuburi de silicon care permit respirația pe nas încă din prima zi.',
      },
      {
        title: 'Recuperarea',
        body:
          'Rinoplastia, de regulă, nu doare: nasul e tensionat sub atelă, pot apărea edem și vânătăi pe față/pleoape. Externarea e a doua zi. Firele se scot la 7 zile; atela se îndepărtează la 2 săptămâni. Nu judecați rezultatul imediat — edemul se remite semnificativ în prima lună și se stabilizează până la ~1 an.',
      },
      {
        title: 'Documente de semnat',
        body:
          'Consimțămintele și formularele pe care le semnați vor apărea aici, gata de descărcat, de îndată ce le avem finalizate.',
      },
    ],
    documents: [
      // Drop PDFs in apps/web/public/docs/rinoplastie/ then list them here, e.g.:
      // { title: 'Consimțământ informat — rinoplastie', href: '/docs/rinoplastie/consimtamant.pdf' },
    ],
    faqTopic: 'Rinoplastie',
  },
};

export function patientGuideFor(categorySlug?: string | null): PatientGuide | null {
  if (!categorySlug) {
    return null;
  }
  return PATIENT_GUIDES[categorySlug] ?? null;
}
