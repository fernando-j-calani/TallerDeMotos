import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './RegistroPage.css';
import { API_BASE_URL } from './config';
import { PASSWORD_POLICY_MESSAGE, validateStrongPassword } from './passwordPolicy';
import { getHomeRouteByRole } from './navigation';
import { repairText } from './textNormalization';

const maskEmail = (value) => {
  const [local, domain] = (value || '').split('@');
  if (!local || !domain) return value || '';
  return `${local[0]}***@${domain[0]}***`;
};

export default function RegistroPage() {
  const [activeTab, setActiveTab] = useState('register');
  const [heroLogoTop, setHeroLogoTop] = useState(260);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  
  // Register form state
  const [fullName, setFullName] = useState('');
  const [cedula, setCedula] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+591');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Verificación de cuenta tras registro (pestaña "Crear cuenta"): null | 'code'
  const [registerStep, setRegisterStep] = useState(null);
  const [registerVerifyCode, setRegisterVerifyCode] = useState('');
  const [registerVerifyError, setRegisterVerifyError] = useState('');
  const [registerVerifyMessage, setRegisterVerifyMessage] = useState('');
  const [registerVerifyLoading, setRegisterVerifyLoading] = useState(false);
  const [registerResendLoading, setRegisterResendLoading] = useState(false);
  const [registerResendMessage, setRegisterResendMessage] = useState('');

  // Flujo de recuperación de contraseña (pestaña "Iniciar Sesión"): null | 'email' | 'code' | 'password'
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
  
  const loginFormRef = useRef(null);
  const registerFormRef = useRef(null);
  const heroLogoRef = useRef(null);

  // Adjust hero logo position based on active form
  const adjustHeroPosition = useCallback(() => {
    const activeForm = activeTab === 'login' ? loginFormRef.current : registerFormRef.current;
    if (!activeForm || !heroLogoRef.current) return;

    const rect = activeForm.getBoundingClientRect();
    const heroRect = heroLogoRef.current.getBoundingClientRect();
    const proportionalMargin = Math.max(160, rect.height * 0.14);
    const top = window.scrollY + rect.top - heroRect.height - proportionalMargin;

    setHeroLogoTop(Math.max(140, top));
  }, [activeTab, recoveryStep, registerStep]);

  useEffect(() => {
    adjustHeroPosition();
    window.addEventListener('resize', adjustHeroPosition);
    return () => window.removeEventListener('resize', adjustHeroPosition);
  }, [adjustHeroPosition]);

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
      const res = await fetch(`${API_BASE_URL}/api/permisos/`, {
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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await response.json();

      if (response.ok && data.exito) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        localStorage.setItem('requires_password_change', data.requires_password_change ? '1' : '0');

        if (data.requires_password_change) {
          navigate('/cambiar-password-obligatorio');
        } else {
          const homeRoute = await resolveHomeRoute(data.usuario);
          navigate(homeRoute);
        }
      } else {
        setMessage(repairText(data.error || 'Error al iniciar sesión'));
      }
    } catch (error) {
      setMessage('Error de conexión');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/password/forgot/`, {
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
      const verifyRes = await fetch(`${API_BASE_URL}/api/password/verify-code/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, codigo: confirmCode }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setConfirmError(verifyData.error || 'Código incorrecto o expirado.');
        return;
      }

      const resetRes = await fetch(`${API_BASE_URL}/api/password/reset/`, {
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
      const res = await fetch(`${API_BASE_URL}/api/password/forgot/`, {
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

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          cedula,
          email,
          country_code: countryCode,
          phone,
          password,
          confirm_password: confirmPassword,
        })
      });

      const data = await response.json();

      if (response.ok) {
        setRegisterVerifyCode('');
        setRegisterVerifyError('');
        setRegisterVerifyMessage('');
        setRegisterResendMessage('');
        setRegisterStep('code');
      } else {
        setMessage(data.error || 'Error al crear la cuenta');
      }
    } catch (error) {
      setMessage('Error de conexión');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRegisterCode = async (e) => {
    e.preventDefault();
    setRegisterVerifyError('');
    setRegisterVerifyMessage('');
    setRegisterVerifyLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/register/verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo: registerVerifyCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRegisterVerifyError(data.error || 'Código incorrecto o expirado.');
        return;
      }

      setRegisterVerifyMessage('Cuenta verificada exitosamente. Ahora puede iniciar sesión.');
      setTimeout(() => {
        handleRegisterVerified();
      }, 2000);
    } catch {
      setRegisterVerifyError('Error de conexión con el servidor.');
    } finally {
      setRegisterVerifyLoading(false);
    }
  };

  const handleResendRegisterCode = async () => {
    setRegisterVerifyError('');
    setRegisterResendMessage('');
    setRegisterResendLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/register/resend/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRegisterVerifyError(data.error || 'No se pudo reenviar el código.');
        return;
      }

      setRegisterVerifyCode('');
      setRegisterResendMessage('Hemos reenviado el código a tu correo.');
    } catch {
      setRegisterVerifyError('Error de conexión con el servidor.');
    } finally {
      setRegisterResendLoading(false);
    }
  };

  const handleRegisterVerified = () => {
    const verifiedEmail = email;

    setRegisterStep(null);
    setRegisterVerifyCode('');
    setRegisterVerifyError('');
    setRegisterVerifyMessage('');
    setRegisterResendMessage('');

    setFullName('');
    setCedula('');
    setEmail('');
    setCountryCode('+591');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setMessage('');

    setActiveTab('login');
    setRecoveryStep(null);
    setLoginEmail(verifiedEmail);
    setLoginPassword('');
  };

  return (
    <div className="registro-page">
      <div className="bg-holder" style={{ backgroundImage: 'url(/static/img/registro/hero-header-bg.png)' }}>
        <nav className="navbar">
          <Link to="/" className="brand-small">
            <img src="/static/img/registro/footer-logo.png" alt="logo" />
          </Link>
          <Link to="/" className="btn-inicio">Inicio</Link>
        </nav>
        <div className="bg-overlay"></div>

        <div 
          className="hero-logo" 
          ref={heroLogoRef}
          style={{ top: `${heroLogoTop}px` }}
        >
          <img src="/static/img/registro/footer-logo.png" alt="Taller La Roca Logo" onLoad={adjustHeroPosition} />
        </div>

        <div className="form-wrapper">
          {/* Tabs */}
          <div className="tabs">
            <div className="tab-half">
              <button
                className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => { setActiveTab('login'); setRecoveryStep(null); }}
              >
                Iniciar Sesión
              </button>
            </div>
            <div className="tab-half">
              <button
                className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => { setActiveTab('register'); setRecoveryStep(null); }}
              >
                Crear cuenta
              </button>
            </div>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && recoveryStep === null && (
            <form className="form-content" ref={loginFormRef} onSubmit={handleLoginSubmit}>
              <h1 className="form-title">Iniciar sesión</h1>

              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  name="email"
                  className="form-control"
                  type="email"
                  placeholder="Escriba su Email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Contraseña</label>
                <div className="password-wrapper">
                  <input
                    id="login-password"
                    name="password"
                    className="form-control"
                    type={loginShowPassword ? 'text' : 'password'}
                    placeholder="Escriba su Contraseña"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setLoginShowPassword(!loginShowPassword)}
                    aria-label="Mostrar/Ocultar contraseña"
                  >
                    <i className={`fas ${loginShowPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'Cargando...' : 'Iniciar sesión'}
              </button>

              <button
                type="button"
                className="forgot"
                onClick={() => setRecoveryStep('email')}
              >
                ¿Olvidó su contraseña?
              </button>

              {message && (
                <div className={`alert ${message.includes('exitosamente') ? 'alert-success' : 'alert-error'}`}>
                  {message}
                </div>
              )}
            </form>
          )}

          {/* Restablecer contraseña (paso: email) */}
          {activeTab === 'login' && recoveryStep === 'email' && (
            <form className="form-content" ref={loginFormRef} onSubmit={handleForgotSubmit}>
              <h1 className="form-title">Restablecer contraseña</h1>

              {forgotError && (
                <div className="alert alert-error">
                  {forgotError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">Escriba su email</label>
                <input
                  id="forgot-email"
                  name="email"
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

          {/* Verificación de código (paso: code) */}
          {activeTab === 'login' && recoveryStep === 'code' && (
            <form className="form-content" ref={loginFormRef} onSubmit={handleConfirmAndReset}>
              <h1 className="form-title">Restablecer contraseña</h1>

              <p className="confirm-text">
                Te hemos enviado un código de confirmación a <strong>{maskEmail(forgotEmail)}</strong>.
                Ingrésalo junto con tu nueva contraseña. {PASSWORD_POLICY_MESSAGE}
              </p>

              {confirmError && (
                <div className="alert alert-error">
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

          {/* Register Form */}
          {activeTab === 'register' && registerStep === null && (
            <form className="form-content" ref={registerFormRef} onSubmit={handleRegisterSubmit}>
              <h1 className="form-title">Crear cuenta</h1>

              <div className="form-group">
                <label className="form-label" htmlFor="register-full_name">Nombre Completo</label>
                <input
                  id="register-full_name"
                  name="full_name"
                  className="form-control"
                  type="text"
                  placeholder="Ingrese su nombre"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-cedula">Cédula/NIT</label>
                <input
                  id="register-cedula"
                  name="cedula"
                  className="form-control"
                  type="text"
                  placeholder="Ingrese su número de cédula o NIT"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-email">Email</label>
                <input
                  id="register-email"
                  name="email"
                  className="form-control"
                  type="email"
                  placeholder="Ingrese su correo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Número de teléfono</label>
                <div className="phone-input">
                  <select
                    className="form-control"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                  >
                    <option value="+506">+506</option>
                    <option value="+591">+591</option>
                    <option value="+52">+52</option>
                    <option value="+34">+34</option>
                    <option value="+1">+1</option>
                  </select>
                  <input
                    name="phone"
                    className="form-control"
                    type="tel"
                    placeholder="Ingrese su número de teléfono"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-password">Contraseña</label>
                <div className="password-wrapper">
                  <input
                    id="register-password"
                    name="password"
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
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Mostrar/Ocultar contraseña"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-confirm_password">Confirmar contraseña</label>
                <div className="password-wrapper">
                  <input
                    id="register-confirm_password"
                    name="confirm_password"
                    className="form-control"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirme su contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Mostrar/Ocultar contraseña"
                  >
                    <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'Cargando...' : 'Crear cuenta'}
              </button>

              {message && (
                <div className={`alert ${message.includes('exitosamente') ? 'alert-success' : 'alert-error'}`}>
                  {message}
                </div>
              )}
            </form>
          )}

          {/* Verificación de cuenta tras registro */}
          {activeTab === 'register' && registerStep === 'code' && (
            <form className="form-content" ref={registerFormRef} onSubmit={handleVerifyRegisterCode}>
              <h1 className="confirm-title">Le hemos enviado un correo electrónico</h1>

              <p className="confirm-text">
                El código está en camino. Para activar tu cuenta, escribe el código que
                hemos enviado por correo electrónico a <strong>{maskEmail(email)}</strong>.
                Es posible que tarde un minuto en llegar.
              </p>

              {registerVerifyError && (
                <div className="alert alert-error">{registerVerifyError}</div>
              )}

              {registerResendMessage && (
                <div className="alert alert-success">{registerResendMessage}</div>
              )}

              {registerVerifyMessage && (
                <div className="alert alert-success">{registerVerifyMessage}</div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="register-confirm-code">Código de confirmación</label>
                <input
                  id="register-confirm-code"
                  className="form-control"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Ingrese el código"
                  value={registerVerifyCode}
                  onChange={(e) => setRegisterVerifyCode(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-login" disabled={registerVerifyLoading}>
                {registerVerifyLoading ? 'Confirmando...' : 'Confirmar'}
              </button>

              <button
                type="button"
                className="btn-outline"
                onClick={handleResendRegisterCode}
                disabled={registerResendLoading}
              >
                {registerResendLoading ? 'Reenviando...' : 'Reenviar código'}
              </button>
            </form>
          )}
        </div>
      </div>

      <footer className="footer">
        <div className="footer-top">
          <div className="container">
            <div className="ft-left">
              <img src="/static/img/registro/footer-logo.png" alt="Logo" />
              <div className="ft-socials">
                <a href="https://www.facebook.com/mototallerMR" target="_blank" rel="noopener noreferrer">
                  <img src="/static/img/registro/facebook.png" alt="Facebook" />
                </a>
                <a href="https://www.instagram.com/mototallerMR" target="_blank" rel="noopener noreferrer">
                  <img src="/static/img/registro/instagram.png" alt="Instagram" />
                </a>
              </div>
            </div>
            <div className="ft-item"><i className="fas fa-phone"></i> <span>+591 77712345</span></div>
            <div className="ft-item"><i className="fas fa-map-pin"></i> <span>Av. Radial 27, Santa Cruz - Bolivia</span></div>
            <div className="ft-item" style={{ textAlign: 'left' }}>
              <i className="fas fa-clock"></i>
              <div>Lunes a Viernes<br/>8:00 AM - 5:30 PM</div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <div>Todos los derechos reservados © Taller de Motos LA ROCA, 2025 - v.1.0.8</div>
            <div>Hecho con <i className="fas fa-heart" style={{ color: '#F95C19', margin: '0 6px' }}></i> por GRUPO 2</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
