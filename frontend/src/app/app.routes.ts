import { Routes } from '@angular/router';
import { requiereRol, soloVisitantes } from './core/seguridad';
import { SitioLayout } from './sitio/sitio-layout';
import { PanelLayout } from './panel/panel-layout';

/**
 * Mapa de navegación. Las páginas se cargan bajo demanda (lazy loading) para que la carta
 * pública abra rápido sin descargar el código del panel administrativo.
 */
export const routes: Routes = [
  {
    path: 'admin',
    component: PanelLayout,
    canActivate: [requiereRol('ADMIN')],
    data: { modo: 'admin' },
    children: [
      { path: '', title: 'Resumen — Panel Café Catorce', loadComponent: () => import('./panel/resumen/resumen').then(m => m.ResumenPagina) },
      { path: 'reservas', title: 'Reservas — Panel Café Catorce', loadComponent: () => import('./panel/reservas/reservas').then(m => m.ReservasPagina) },
      { path: 'mesas', title: 'Mesas — Panel Café Catorce', loadComponent: () => import('./panel/mesas/mesas').then(m => m.MesasPagina) },
      { path: 'productos', title: 'Productos — Panel Café Catorce', loadComponent: () => import('./panel/productos/productos').then(m => m.ProductosPagina) },
      { path: 'secciones', title: 'Secciones — Panel Café Catorce', loadComponent: () => import('./panel/secciones/secciones').then(m => m.SeccionesPagina) },
      { path: 'cuentas', title: 'Cuentas — Panel Café Catorce', loadComponent: () => import('./panel/cuentas/cuentas').then(m => m.CuentasPagina) },
    ],
  },
  {
    path: 'empleado',
    component: PanelLayout,
    canActivate: [requiereRol('EMPLEADO')],
    data: { modo: 'empleado' },
    children: [
      { path: '', title: 'Reservas de hoy — Café Catorce', loadComponent: () => import('./panel/reservas/reservas').then(m => m.ReservasPagina) },
      { path: 'sala', title: 'Sala — Café Catorce', loadComponent: () => import('./panel/mesas/mesas').then(m => m.MesasPagina) },
    ],
  },
  {
    path: '',
    component: SitioLayout,
    children: [
      { path: '', title: 'Café Catorce — Cafetería de especialidad de barrio', loadComponent: () => import('./sitio/inicio/inicio').then(m => m.InicioPagina) },
      { path: 'carta', title: 'Carta — Café Catorce', loadComponent: () => import('./sitio/carta/carta').then(m => m.CartaPagina) },
      { path: 'reservar', title: 'Reservar mesa — Café Catorce', loadComponent: () => import('./sitio/reservar/reservar').then(m => m.ReservarPagina) },
      { path: 'mi-cuenta', title: 'Mi cuenta — Café Catorce', canActivate: [requiereRol('CLIENTE')], loadComponent: () => import('./sitio/mi-cuenta/mi-cuenta').then(m => m.MiCuentaPagina) },
      { path: 'login', title: 'Ingresar — Café Catorce', canActivate: [soloVisitantes], loadComponent: () => import('./sitio/acceso/login').then(m => m.LoginPagina) },
      { path: 'registro', title: 'Crear cuenta — Café Catorce', canActivate: [soloVisitantes], loadComponent: () => import('./sitio/acceso/registro').then(m => m.RegistroPagina) },
      { path: '**', title: 'Página no encontrada — Café Catorce', loadComponent: () => import('./sitio/no-encontrada').then(m => m.NoEncontradaPagina) },
    ],
  },
];
