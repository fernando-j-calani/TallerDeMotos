import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import Login from './Login';
import Bitacora from './Bitacora';
import Usuarios from './Usuarios';
import RolesPermisos from './RolesPermisos';
import Clientes from './Clientes';
import Motocicletas from './Motocicletas';
import Proveedores from './Proveedores';
import Productos from './Productos';
import Compras from './Compras';
import Inventario from './Inventario';
import Cotizaciones from './Cotizaciones';
import Perfil from './Perfil';
import MisMotocicletas from './MisMotocicletas';
import InicioOperativo from './InicioOperativo';
import ForgotPasswordRequest from './ForgotPasswordRequest';
import ResetPassword from './ResetPassword';
import ForceChangePassword from './ForceChangePassword';
import './index.css';

document.body.style.margin = "0";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPasswordRequest />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/cambiar-password-obligatorio" element={<ForceChangePassword />} />
        {/* Ruta protegida: La Bitácora */}
        <Route path="/bitacora" element={<Bitacora />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/roles-permisos" element={<RolesPermisos />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/compras" element={<Compras />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/cotizaciones" element={<Cotizaciones />} />
        <Route path="/motocicletas" element={<Motocicletas />} />
        <Route path="/mis-motocicletas" element={<MisMotocicletas />} />
        <Route path="/inicio" element={<InicioOperativo />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);