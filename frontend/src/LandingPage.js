import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWrench, faMotorcycle, faCog, faGasPump, faHand, faStethoscope, faClipboard, faToolbox, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faInstagram, faWhatsapp, faWaze } from '@fortawesome/free-brands-svg-icons';
import './LandingPage.css';

const WHATSAPP_NUMERO = '59173766956';

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const brands = [
    { file: 'bmw.png', name: 'BMW' },
    { file: 'honda.png', name: 'Honda' },
    { file: 'yamaha.png', name: 'Yamaha' },
    { file: 'kawasaki.png', name: 'Kawasaki' },
    { file: 'suzuki.png', name: 'Suzuki' },
    { file: 'ktm.png', name: 'KTM' },
    { file: 'ducati.png', name: 'Ducati' },
    { file: 'triumph.png', name: 'Triumph' },
    { file: 'aprilia.png', name: 'Aprilia' },
    { file: 'moto-guzzi.png', name: 'Moto Guzzi' },
    { file: 'husqvarna.png', name: 'Husqvarna' }
  ];

  const partners = [
    { file: 'kambox.png', name: 'KamBox - Envíos USA-CR' },
    { file: 'primium-motos.png', name: 'Primium Motos' },
    { file: 'emergencia-moto.png', name: 'Emergencia Moto' }
  ];

  const heroSlides = [
    { image: '/landing-assets/hero/hero-1.jpg', title: 'Preventivos y Correctivos', label: 'Servicio de reparación y mantenimientos', button: 'Conozca más' },
    { image: '/landing-assets/hero/hero-2.jpg', title: '¡Taller Multimarca!', label: 'Confía tu moto a un experto', button: 'Conócenos' },
    { image: '/landing-assets/hero/hero-3.jpg', title: 'Alta Cilindrada', label: 'Nos especializamos en motocicletas de', button: 'Ver más' },
    { image: '/landing-assets/hero/hero-4.jpg', title: 'Disponible al registrarte', label: 'Historial de servicios de tu moto', button: 'Regístrate' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const handleWhatsAppForm = (e) => {
    e.preventDefault();
    const nombre = document.querySelector('input[name="nombre"]')?.value || 'Cliente';
    const correo = document.querySelector('input[name="correo"]')?.value || 'No proporcionado';
    const moto = document.querySelector('input[name="moto"]')?.value || 'Mi moto';
    const mensaje = document.querySelector('textarea[name="mensaje"]')?.value || 'Hola, necesito información';
    const text = `Hola, soy ${nombre}. Mi correo es ${correo}. Tengo una ${moto}. ${mensaje}`;
    window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(text)}`);
  };

  return (
    <div className="lp-page">
      {/* HEADER */}
      <header className={`lp-header ${scrolled ? 'lp-header-scrolled' : ''}`}>
        <Link to="/" className="lp-logo" onClick={closeMenu}>
          <img src="/landing-assets/logo.png" alt="Taller La Roca" />
        </Link>

        <nav className={`lp-nav ${menuOpen ? 'lp-nav-open' : ''}`}>
          <a href="#inicio" onClick={closeMenu}>INICIO</a>
          <a href="#contacto" onClick={closeMenu}>CONTACTO</a>
          <Link to="/registro" onClick={closeMenu}>REGISTRARME</Link>
          <Link to="/login" onClick={closeMenu}>MI CUENTA</Link>
        </nav>

        <div className="lp-social-icons">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <FontAwesomeIcon icon={faFacebook} />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <FontAwesomeIcon icon={faInstagram} />
          </a>
        </div>

        <button className={`lp-menu-toggle ${menuOpen ? 'open' : ''}`} onClick={toggleMenu} aria-label="Menú">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      {/* HERO CAROUSEL */}
      <section id="inicio" className="lp-hero">
        <div className="lp-carousel-container">
          {heroSlides.map((slide, idx) => (
            <div
              key={idx}
              className={`lp-slide ${idx === currentSlide ? 'active' : ''}`}
              style={{
                backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2)), url('${slide.image}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="lp-slide-content">
                <p className="lp-slide-label">{slide.label}</p>
                <h1>{slide.title}</h1>
                <a href={idx === 3 ? '/login' : '#nosotros'} className="lp-btn-hero">
                  {slide.button}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Slide indicators */}
        <div className="lp-carousel-indicators">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              className={`lp-indicator ${idx === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Slide ${idx + 1}`}
            >
              {String(idx + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="lp-section lp-services">
        <div className="lp-container">
          <div className="lp-section-header">
            <p className="lp-section-label">Servicios</p>
            <h2>Especialistas en Mantenimiento y Reparación de Motos de Alta Cilindrada</h2>
            <p>Ofrecemos servicios integrales para motocicletas: mantenimiento, reparación de sistemas clave como suspensión, frenos, inyección y más, con la mejor atención y calidad.</p>
          </div>

          <div className="lp-services-grid">
            {[
              { title: 'Mantenimientos', desc: 'Realizamos mantenimiento preventivo y correctivo para prolongar la vida útil de tu motocicleta.', icon: faWrench },
              { title: 'Suspensiones', desc: 'Ajuste, reparación y mejora de sistemas de suspensión para una conducción más segura y cómoda.', icon: faMotorcycle },
              { title: 'Motores', desc: 'Diagnóstico y reparación de fallos mecánicos, reconstrucción de motores y ajustes de rendimiento.', icon: faCog },
              { title: 'Inyección', desc: 'Servicio de limpieza, diagnóstico y reparación del sistema de inyección electrónica.', icon: faGasPump },
              { title: 'Frenos', desc: 'Revisión, ajuste y reemplazo de frenos para garantizar tu seguridad en cada trayecto.', icon: faHand },
              { title: 'Diagnósticos', desc: 'Utilizamos herramientas especializadas para detectar problemas y brindarte soluciones precisas.', icon: faStethoscope },
              { title: 'Revisiones generales', desc: 'Inspección completa de tu moto para asegurar que todo funcione correctamente en cada sistema.' , icon: faClipboard },
              { title: 'Y mucho más', desc: 'Brindamos soluciones adicionales según las necesidades específicas de tu motocicleta.', icon: faToolbox }
            ].map((srv, idx) => (
              <div key={idx} className="lp-service-card">
                <div className="lp-service-icon">
                  <FontAwesomeIcon icon={srv.icon} />
                </div>
                <h3>{srv.title}</h3>
                <p>{srv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALERÍA */}
      <section id="galeria" className="lp-gallery">
        <div className="lp-gallery-grid">
          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
            <div key={num} className="lp-gallery-item">
              <img
                src={`/landing-assets/work/work-${num}.jpg`}
                alt={`Trabajo ${num}`}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="nosotros" className="lp-section lp-about">
        <div className="lp-container">
          <div className="lp-about-grid">
            <div className="lp-about-images">
              <img src="/landing-assets/about/about-1.jpg" alt="Taller" className="lp-about-main" loading="lazy" />
              <div className="lp-about-small-images">
                <img src="/landing-assets/about/about-2.jpg" alt="Equipo" className="lp-about-small" loading="lazy" />
                <img src="/landing-assets/about/about-3.jpg" alt="Servicio" className="lp-about-small" loading="lazy" />
              </div>
            </div>
            <div className="lp-about-content">
              <h2>Taller de Motos La Roca</h2>
              <div className="lp-about-divider"></div>

              <div className="lp-about-columns">
                <div className="lp-about-column">
                  <h3>Sobre nosotros</h3>
                  <p>Somos un taller especializado con más de 10 años de experiencia en mantenimiento y reparación de motocicletas de alta cilindrada. Nuestro equipo de técnicos certificados utiliza tecnología de punta para garantizar el mejor servicio.</p>
                </div>
                <div className="lp-about-column">
                  <h3>Quiénes somos</h3>
                  <p>Trabajamos con todas las marcas principales: BMW, Ducati, Yamaha, Honda, KTM, Kawasaki, Suzuki, Triumph y muchas más.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARCAS */}
      <section id="marcas" className="lp-section lp-brands">
        <div className="lp-container">
          <h3 className="lp-brands-title">Trabajamos con todas estas marcas</h3>
          <div className="lp-brands-grid">
            <div className="lp-brands-track">
              {[...brands, ...brands].map((brand, idx) => (
                <img
                  key={`${brand.file}-${idx}`}
                  src={`/landing-assets/brands/${brand.file}`}
                  alt={brand.name}
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="lp-section lp-contact">
        <div className="lp-container">
          <div className="lp-contact-top">
            <div className="lp-contact-top-item">
              <div className="lp-contact-icon">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
              </div>
              <div>
                <strong>Dirección</strong>
                <p>6to Anillo, entre Av. 2 de Agosto y Av. Alemana, Santa Cruz - Bolivia</p>
              </div>
            </div>
            <div className="lp-contact-top-item">
              <div className="lp-contact-icon">
                <FontAwesomeIcon icon={faWhatsapp} />
              </div>
              <div>
                <strong>WhatsApp</strong>
                <p>
                  <a href={`https://wa.me/${WHATSAPP_NUMERO}`} target="_blank" rel="noopener noreferrer">
                    +591 73766956
                  </a>
                </p>
              </div>
            </div>
            <div className="lp-contact-top-item">
              <div className="lp-contact-icon">
                <FontAwesomeIcon icon={faWaze} />
              </div>
              <div>
                <strong>Waze</strong>
                <p>
                  <a href="https://waze.com/ul?q=6to+Anillo%2C+entre+Av.+2+de+Agosto+y+Av.+Alemana%2C+Santa+Cruz+-+Bolivia" target="_blank" rel="noopener noreferrer">
                    6to Anillo, entre Av. 2 de Agosto y Av. Alemana, Santa Cruz - Bolivia
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="lp-contact-heading">
            <h2>Contáctanos</h2>
            <div className="lp-about-divider"></div>
          </div>

          <form className="lp-contact-form" onSubmit={handleWhatsAppForm}>
            <div className="lp-form-group">
              <label htmlFor="lp-nombre">Nombre</label>
              <input id="lp-nombre" type="text" name="nombre" placeholder="Tu nombre" required />
            </div>
            <div className="lp-form-group">
              <label htmlFor="lp-correo">Correo Electrónico</label>
              <input id="lp-correo" type="email" name="correo" placeholder="Tu correo electrónico" required />
            </div>
            <div className="lp-form-group">
              <label htmlFor="lp-moto">Marca y Modelo de la Moto</label>
              <input id="lp-moto" type="text" name="moto" placeholder="Tu modelo de moto" required />
            </div>
            <div className="lp-form-group">
              <label htmlFor="lp-mensaje">Mensaje</label>
              <textarea id="lp-mensaje" name="mensaje" placeholder="Tu mensaje" rows="5" required></textarea>
            </div>
            <button type="submit" className="lp-btn lp-btn-whatsapp">Enviar a WhatsApp</button>
          </form>
        </div>
      </section>

      {/* TE PODRÍA INTERESAR */}
      <section
        className="lp-section lp-interest"
        style={{ backgroundImage: "url('/landing-assets/custom/callto-bg.jpg')" }}
      >
        <div className="lp-container">
          <div className="lp-section-header">
            <p className="lp-section-label">Más Servicios</p>
            <h2>Te podría interesar</h2>
          </div>
          <div className="lp-partners-grid">
            {partners.map((partner, idx) => (
              <div key={idx} className="lp-partner-card">
                <img src={`/landing-assets/partners/${partner.file}`} alt={partner.name} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-top">
            <Link to="/" className="lp-footer-logo">
              <img src="/landing-assets/logo.png" alt="Taller de Motos La Roca" loading="lazy" />
            </Link>
            <div className="lp-footer-social">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FontAwesomeIcon icon={faFacebook} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
            </div>
          </div>

          <div className="lp-footer-content">
            <div>
              <h4>Sobre nosotros</h4>
              <p>Somos un taller especializado con más de 10 años de experiencia en mantenimiento y reparación de motocicletas de alta cilindrada. Nuestro equipo de técnicos certificados utiliza tecnología de punta para garantizar el mejor servicio.</p>
            </div>
            <div>
              <h4>Quiénes somos</h4>
              <a href="#nosotros">Especialistas en alta cilindrada</a>
              <a href="#marcas">Trabajamos con todas las marcas</a>
            </div>
            <div>
              <h4>Servicios</h4>
              <a href="#servicios">Mantenimientos</a>
              <a href="#servicios">Suspensiones</a>
              <a href="#servicios">Motores</a>
              <a href="#servicios">Inyección</a>
            </div>
            <div>
              <h4>Contacto</h4>
              <p>+591 73766956</p>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <p>Copyright © 2026 Todos los derechos reservados | Taller de Motos La Roca</p>
        </div>
      </footer>

      {/* WHATSAPP BUTTON */}
      <a href={`https://wa.me/${WHATSAPP_NUMERO}`} target="_blank" rel="noopener noreferrer" className="lp-whatsapp-button" title="Enviar WhatsApp">
        <FontAwesomeIcon icon={faWhatsapp} />
      </a>
    </div>
  );
};

export default LandingPage;
