import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import RegistroPage from './RegistroPage';
import Login from './Login';
import Bitacora from './Bitacora';
import Usuarios from './Usuarios';
import RolesPermisos from './RolesPermisos';
import Clientes from './Clientes';
import Motocicletas from './Motocicletas';
import Proveedores from './Proveedores';
import Productos from './Productos';
import Inventario from './Inventario';
import Compras from './Compras';
import Cotizaciones from './Cotizaciones';
import OrdenesTrabajo from './OrdenesTrabajo';
import NotasTrabajo from './NotasTrabajo';
import Facturacion from './Facturacion';
import HistorialMantenimiento from './HistorialMantenimiento';
import SeguimientoClientes from './SeguimientoClientes';
import Reportes from './Reportes';
import DashboardAnalitico from './DashboardAnalitico';
import Perfil from './Perfil';
import MisMotocicletas from './MisMotocicletas';
import PagoCliente from './PagoCliente';
import DetalleMotocicleta from './DetalleMotocicleta';
import InicioOperativo from './InicioOperativo';
import AsignarPrivilegios from './AsignarPrivilegios';
import ForgotPasswordRequest from './ForgotPasswordRequest';
import ResetPassword from './ResetPassword';
import ForceChangePassword from './ForceChangePassword';
import SessionGuard from './SessionGuard';
import SesionInactividad from './SesionInactividad';
import './index.css';

document.body.style.margin = "0";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <SessionGuard />
      <SesionInactividad />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<RegistroPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordRequest />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/cambiar-password-obligatorio" element={<ForceChangePassword />} />
        {/* Ruta protegida: La Bitácora */}
        <Route path="/bitacora" element={<Bitacora />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/roles-permisos" element={<RolesPermisos />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/motocicletas" element={<Motocicletas />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/compras" element={<Compras />} />
        <Route path="/cotizaciones" element={<Cotizaciones />} />
        <Route path="/ordenes-trabajo" element={<OrdenesTrabajo />} />
        <Route path="/notas-trabajo" element={<NotasTrabajo />} />
        <Route path="/facturacion" element={<Facturacion />} />
        <Route path="/historial-mantenimiento" element={<HistorialMantenimiento />} />
        <Route path="/seguimiento-clientes" element={<SeguimientoClientes />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/dashboard-analitico" element={<DashboardAnalitico />} />
        <Route path="/dashboard" element={<InicioOperativo />} />
        <Route path="/mis-motocicletas" element={<MisMotocicletas />} />
        <Route path="/detalle-motocicleta/:codigo" element={<DetalleMotocicleta />} />
        <Route path="/mis-pagos" element={<PagoCliente />} />
        <Route path="/inicio" element={<InicioOperativo />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/asignar-privilegios" element={<AsignarPrivilegios />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);