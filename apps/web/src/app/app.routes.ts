import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { AboutPageComponent } from './pages/about-page/about-page.component';
import { ContactPageComponent } from './pages/contact-page/contact-page.component';
import { FaqPageComponent } from './pages/faq-page/faq-page.component';
import { GalleryPageComponent } from './pages/gallery-page/gallery-page.component';
import { GalleryAlbumPageComponent } from './pages/gallery-album-page/gallery-album-page.component';
import { CategoryPageComponent } from './pages/category-page/category-page.component';
import { ProcedurePageComponent } from './pages/procedure-page/procedure-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'chirurgul', component: AboutPageComponent },
  { path: 'contact', component: ContactPageComponent },
  { path: 'faq', component: FaqPageComponent },
  { path: 'galerie', component: GalleryPageComponent },
  { path: 'galerie/:albumSlug', component: GalleryAlbumPageComponent },
  // Legacy URLs from the broader procedure tree
  { path: 'chirurgia-faciala/rinoplastia', redirectTo: 'rinoplastie/rinoplastie-primara' },
  { path: 'chirurgia-faciala', redirectTo: 'rinoplastie' },
  { path: 'alte-proceduri/nechirurgicale', redirectTo: 'injectabile/injectabile' },
  { path: 'alte-proceduri', redirectTo: 'injectabile' },
  { path: 'galerie/rinoplastie', redirectTo: 'galerie/rinoplastie-primara' },
  { path: ':categorySlug', component: CategoryPageComponent },
  { path: ':categorySlug/:procedureSlug', component: ProcedurePageComponent },
  { path: '**', redirectTo: '' },
];
