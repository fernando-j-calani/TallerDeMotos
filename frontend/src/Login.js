// frontend/src/Login.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import { getHomeRouteByRole } from './navigation';
import { repairText } from './textNormalization';
import { API_BASE_URL } from './config';
import { PASSWORD_POLICY_MESSAGE, validateStrongPassword } from './passwordPolicy';
import { logoutUniversal, fetchWithIP } from './auth';

const leerUsuarioLocal = () => {
  try {
    return JSON.parse(localStorage.getItem('usuario'));
  } catch {
    return null;
  }
};

const maskEmail = (value) => {
  const [local, domain] = (value || '').split('@');
  if (!local || !domain) return value || '';
  return `${local[0]}***@${domain[0]}***`;
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // Flujo de recuperación de contraseña: null | 'email' | 'code' | 'password'
  const [recoveryStep, setRecoveryStep] = useState(null);

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const [confirmCode, setConfirmCode] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
  const [newPasswordMessage, setNewPasswordMessage] = useState('');

  const [heroLogoTop, setHeroLogoTop] = useState(380);
  const heroLogoRef = useRef(null);
  const formWrapperRef = useRef(null);

  // Sesión ya activa en este navegador (otra pestaña/ventana con localStorage compartido)
  const [usuarioConSesion, setUsuarioConSesion] = useState(() => leerUsuarioLocal());
  const [forzarFormulario, setForzarFormulario] = useState(false);
  const [cambiandoCuenta, setCambiandoCuenta] = useState(false);
  const haySesionActiva = !!localStorage.getItem('token') && !!usuarioConSesion && !forzarFormulario;

  const navigate = useNavigate();

  useEffect(() => {
    const motivo = localStorage.getItem('sesion_cerrada_motivo');
    if (motivo) {
      setError(repairText(motivo));
      localStorage.removeItem('sesion_cerrada_motivo');
    }
  }, []);

  const resolveHomeRoute = async (usuario) => {
    if (!usuario?.rol) {
      return '/login';
    }
    if (usuario.rol === 'Administrador') {
      return '/bitacora';
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return getHomeRouteByRole(usuario.rol);
      }
      const res = await fetchWithIP(`${API_BASE_URL}/api/permisos/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => []);
      if (res.ok && Array.isArray(data)) {
        const tieneBitacora = data.some(
          (permiso) =>
            permiso.codigo_cu === 'CU20'
            && permiso.permitido
            && ['Mostrar', 'Buscar', 'Exportar'].includes(permiso.accion)
        );
        if (tieneBitacora) {
          return '/bitacora';
        }
      }
    } catch {
      // Fallback to role-based route
    }

    return getHomeRouteByRole(usuario.rol);
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const respuesta = await fetchWithIP(`${API_BASE_URL}/api/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email, password: password }),
      });

      const datos = await respuesta.json();

      if (respuesta.ok && datos.exito) {
        localStorage.setItem('token', datos.token);
        localStorage.setItem('usuario', JSON.stringify(datos.usuario));
        localStorage.setItem('requires_password_change', datos.requires_password_change ? '1' : '0');
        
        if (datos.requires_password_change) {
          navigate('/cambiar-password-obligatorio');
        } else {
          const homeRoute = await resolveHomeRoute(datos.usuario);
          navigate(homeRoute);
        }
      } else {
        setError(repairText(datos.error || 'Error al iniciar sesion'));
      }
    } catch (err) {
      setError('Error de conexión con el servidor. ¿Está encendido Docker?');
    } finally {
      setCargando(false);
    }
  };

  const irAMiCuenta = async () => {
    const homeRoute = await resolveHomeRoute(usuarioConSesion);
    navigate(homeRoute);
  };

  const cambiarDeCuenta = async () => {
    setCambiandoCuenta(true);
    try {
      await logoutUniversal();
    } finally {
      setUsuarioConSesion(null);
      setForzarFormulario(true);
      setCambiandoCuenta(false);
    }
  };

  const togglePassword = (e) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);

    try {
      const res = await fetchWithIP(`${API_BASE_URL}/api/password/forgot/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || 'No se pudo procesar la solicitud.');
        return;
      }

      setConfirmCode('');
      setConfirmError('');
      setResendMessage('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setNewPasswordMessage('');
      setRecoveryStep('code');
    } catch {
      setForgotError('Error de conexión con el servidor.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleConfirmAndReset = async (e) => {
    e.preventDefault();
    setConfirmError('');
    setNewPasswordMessage('');

    const passwordError = validateStrongPassword(newPassword);
    if (passwordError) {
      setConfirmError(passwordError);
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setConfirmError('La confirmación de contraseña no coincide.');
      return;
    }

    setConfirmLoading(true);
    try {
      const verifyRes = await fetchWithIP(`${API_BASE_URL}/api/password/verify-code/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, codigo: confirmCode }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setConfirmError(verifyData.error || 'Código incorrecto o expirado.');
        return;
      }

      const resetRes = await fetchWithIP(`${API_BASE_URL}/api/password/reset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: verifyData.token,
          password_nueva: newPassword,
          password_confirmacion: newPasswordConfirm,
        }),
      });

      const resetData = await resetRes.json();
      if (!resetRes.ok) {
        setConfirmError(resetData.error || 'No se pudo restablecer la contraseña.');
        return;
      }

      setNewPasswordMessage('Contraseña restablecida exitosamente. Ahora puede iniciar sesión.');
      setTimeout(() => {
        handleBackToLogin();
      }, 2000);
    } catch {
      setConfirmError('Error de conexión con el servidor.');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleResendCode = async () => {
    setConfirmError('');
    setResendMessage('');
    setResendLoading(true);

    try {
      const res = await fetchWithIP(`${API_BASE_URL}/api/password/forgot/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setConfirmError(data.error || 'No se pudo reenviar el código.');
        return;
      }

      setConfirmCode('');
      setResendMessage('Hemos reenviado el código a tu correo.');
    } catch {
      setConfirmError('Error de conexión con el servidor.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setRecoveryStep(null);
    setForgotEmail('');
    setForgotError('');
    setConfirmCode('');
    setConfirmError('');
    setResendMessage('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setNewPasswordMessage('');
  };

  // Adjust hero logo position based on the current form height
  const adjustHeroPosition = useCallback(() => {
    const wrapper = formWrapperRef.current;
    if (!wrapper || !heroLogoRef.current) return;

    const rect = wrapper.getBoundingClientRect();
    const heroRect = heroLogoRef.current.getBoundingClientRect();
    const proportionalMargin = Math.max(160, rect.height * 0.14);
    const top = window.scrollY + rect.top - heroRect.height - proportionalMargin;

    setHeroLogoTop(Math.max(140, top));
  }, [recoveryStep]);

  useEffect(() => {
    adjustHeroPosition();
    window.addEventListener('resize', adjustHeroPosition);
    return () => window.removeEventListener('resize', adjustHeroPosition);
  }, [adjustHeroPosition]);

  return (
    <div className="login-page">
      <div className="bg-holder" style={{ backgroundImage: 'url(/static/img/login/hero-header-bg.png)' }}>
        <nav className="navbar">
          <div className="brand-small">
            <a href="/">
              <img src="/static/img/login/footer-logo.png" alt="Logo Taller La Roca" />
            </a>
          </div>
          <a className="btn-inicio" href="/">Inicio</a>
        </nav>
        <div className="bg-overlay"></div>

        {/* Logo centrado arriba del formulario */}
        <div className="hero-logo" ref={heroLogoRef} style={{ top: `${heroLogoTop}px` }}>
          <img src="/static/img/login/footer-logo.png" alt="Taller La Roca Logo" onLoad={adjustHeroPosition} />
        </div>

        {/* Formulario */}
        <div className="form-wrapper" ref={formWrapperRef}>
          {haySesionActiva && (
            <div className="sesion-activa-card">
              <h1 className="form-title">Ya tienes una sesión activa</h1>
              <p>
                Iniciaste sesión como <strong>{repairText(usuarioConSesion?.nombre)}</strong> ({repairText(usuarioConSesion?.rol)}) en este navegador.
              </p>
              <button type="button" className="btn-login" onClick={irAMiCuenta}>
                Ir a mi cuenta
              </button>
              <button type="button" className="forgot" onClick={cambiarDeCuenta} disabled={cambiandoCuenta}>
                {cambiandoCuenta ? 'Cerrando sesión...' : 'Cerrar sesión e ingresar con otra cuenta'}
              </button>
            </div>
          )}

          {recoveryStep === null && !haySesionActiva && (
            <form onSubmit={manejarSubmit}>
              <h1 className="form-title">Iniciar sesión</h1>

              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  className="form-control"
                  type="email"
                  placeholder="Escriba su Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Contraseña</label>
                <div className="password-wrapper">
                  <input
                    id="password"
                    className="form-control"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Escriba su Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={togglePassword}
                    aria-label="Mostrar/Ocultar contraseña"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-login" disabled={cargando}>
                {cargando ? 'Verificando...' : 'Iniciar sesión'}
              </button>

              <button
                type="button"
                className="forgot"
                onClick={() => setRecoveryStep('email')}
              >
                ¿Olvidó su contraseña?
              </button>
            </form>
          )}

          {recoveryStep === 'email' && (
            <form onSubmit={handleForgotSubmit}>
              <h1 className="form-title">Restablecer contraseña</h1>

              {forgotError && (
                <div className="alert alert-danger">
                  {forgotError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">Escriba su email</label>
                <input
                  id="forgot-email"
                  className="form-control"
                  type="email"
                  placeholder="Escriba su email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-login" disabled={forgotLoading}>
                {forgotLoading ? 'Enviando...' : 'Enviar código'}
              </button>

              <button
                type="button"
                className="forgot"
                onClick={handleBackToLogin}
              >
                Volver a inicio de sesión
              </button>
            </form>
          )}

          {recoveryStep === 'code' && (
            <form onSubmit={handleConfirmAndReset}>
              <h1 className="form-title">Restablecer contraseña</h1>

              <p className="confirm-text">
                Te hemos enviado un código de confirmación a <strong>{maskEmail(forgotEmail)}</strong>.
                Ingrésalo junto con tu nueva contraseña. {PASSWORD_POLICY_MESSAGE}
              </p>

              {confirmError && (
                <div className="alert alert-danger">
                  {confirmError}
                </div>
              )}

              {resendMessage && (
                <div className="alert alert-success">
                  {resendMessage}
                </div>
              )}

              {newPasswordMessage && (
                <div className="alert alert-success">
                  {newPasswordMessage}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="confirm-code">Código</label>
                <input
                  id="confirm-code"
                  className="form-control"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Código"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-password">Nueva contraseña</label>
                <div className="password-wrapper">
                  <input
                    id="new-password"
                    className="form-control"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label="Mostrar/Ocultar contraseña"
                  >
                    <i className={`fas ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-password-confirm">Confirmar contraseña</label>
                <div className="password-wrapper">
                  <input
                    id="new-password-confirm"
                    className="form-control"
                    type={showNewPasswordConfirm ? 'text' : 'password'}
                    placeholder="Confirmar contraseña"
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPasswordConfirm(!showNewPasswordConfirm)}
                    aria-label="Mostrar/Ocultar contraseña"
                  >
                    <i className={`fas ${showNewPasswordConfirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-login" disabled={confirmLoading}>
                {confirmLoading ? 'Enviando...' : 'Enviar'}
              </button>

              <button
                type="button"
                className="forgot forgot-center"
                onClick={handleResendCode}
                disabled={resendLoading}
              >
                {resendLoading ? 'Reenviando...' : 'Reenviar código'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-top">
          <div className="container">
            <div className="ft-left">
              <img src="/static/img/login/footer-logo.png" alt="Logo" />
              <div className="ft-socials">
                <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
                  <img src="/static/img/login/facebook.png" alt="Facebook" />
                </a>
                <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
                  <img src="/static/img/login/instagram.png" alt="Instagram" />
                </a>
              </div>
            </div>
            <div className="ft-item">
              <i className="fas fa-phone"></i>
              <span>+591 73766956</span>
            </div>
            <div className="ft-item">
              <i className="fas fa-map-pin"></i>
              <span>6to Anillo, entre Av. 2 de Agosto y Av. Alemana, Santa Cruz - Bolivia</span>
            </div>
            <div className="ft-item">
              <i className="fas fa-clock"></i>
              <div>Lunes a Viernes<br />8:00 AM - 5:30 PM</div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <div>Todos los derechos reservados © Taller de Motos LA ROCA, 2025 - v.1.0.8</div>
            <div>Hecho con <i className="fas fa-heart"></i> por GRUPO 2</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;