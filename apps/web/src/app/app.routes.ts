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
  { path: ':categorySlug', component: CategoryPageComponent },
  { path: ':categorySlug/:procedureSlug', component: ProcedurePageComponent },
  { path: '**', redirectTo: '' },
];
