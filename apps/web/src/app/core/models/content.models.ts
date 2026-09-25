export interface StrapiMediaFormat {
  url: string;
  width?: number;
  height?: number;
}

export interface StrapiMedia {
  id: number;
  url: string;
  alternativeText?: string | null;
  width?: number;
  height?: number;
  formats?: Record<string, StrapiMediaFormat>;
}

export interface StrapiEntity<T> {
  id: number;
  documentId: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  locale?: string | null;
}

export type WithStrapiMeta<T> = T & StrapiEntity<T>;

export interface SiteSetting {
  siteName: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  logo?: StrapiMedia | null;
}

export interface HomePage {
  heroTitle: string;
  heroSubtitle?: string | null;
  heroImage?: StrapiMedia | null;
  intro?: string | null;
}

export interface AboutPage {
  title: string;
  body: string;
  photo?: StrapiMedia | null;
}

export interface ContactPage {
  title: string;
  body?: string | null;
}

export interface FaqPage {
  title: string;
  intro?: string | null;
}

export interface ProcedureCategory {
  name: string;
  slug: string;
  shortDescription?: string | null;
  body?: string | null;
  order?: number | null;
  coverImage?: StrapiMedia | null;
  procedures?: WithStrapiMeta<Procedure>[];
}

export interface Procedure {
  title: string;
  slug: string;
  summary?: string | null;
  body: string;
  coverImage?: StrapiMedia | null;
  galleryImages?: StrapiMedia[] | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  order?: number | null;
  category?: WithStrapiMeta<ProcedureCategory> | null;
}

export interface GalleryAlbum {
  title: string;
  slug: string;
  description?: string | null;
  order?: number | null;
  images?: WithStrapiMeta<GalleryImage>[];
}

export interface GalleryImage {
  caption?: string | null;
  order?: number | null;
  image: StrapiMedia;
  album?: WithStrapiMeta<GalleryAlbum> | null;
}

export interface FaqItem {
  question: string;
  answer: string;
  topic?: string | null;
  order?: number | null;
}

export interface StrapiListResponse<T> {
  data: WithStrapiMeta<T>[];
  meta?: unknown;
}

export interface StrapiSingleResponse<T> {
  data: WithStrapiMeta<T> | null;
  meta?: unknown;
}
