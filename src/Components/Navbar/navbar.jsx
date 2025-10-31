import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import { useAuthContext } from '../../hooks/useAuthContext';
import logger from '../../utils/logger';
import './navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { user, profile, isAuthenticated, signOut } = useAuthContext();
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const handleAuth = () => {
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleProfile = () => {
    // Navegar a la página de perfil usando React Router
    navigate('/profile');
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setIsMenuOpen(false);
    
    try {
      await signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace(window.location.href);
    } catch (error) {
      logger.error('Error signing out:', error);
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace(window.location.href);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Brand */}
          <Link to="/" className="brand-link">Mala Junta</Link>
          
          {/* Navigation Menu */}
          <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
            <div className="nav-links">
              
              <Link to="/" className="nav-link">Inicio</Link>
              <Link to="/media" className="nav-link">Media</Link>
              <a href="#about" className="nav-link">Acerca de</a>
              
            </div>
            
            {/* Auth Section */}
            <div className="auth-section">
              {isAuthenticated ? (
                <div className="user-dropdown">
                  <button className="user-button">
                    <span className={`user-avatar ${profile?.avatar_url ? 'has-image' : ''}`}>
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Avatar" 
                          className="user-avatar-img"
                          onLoad={() => logger.success('Avatar loaded successfully')}
                          onError={(e) => {
                            logger.warn('Avatar loading failed, using fallback');
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'inline';
                          }}
                        />
                      ) : null}
                      <span 
                        className="user-avatar-initials"
                        style={{ display: profile?.avatar_url ? 'none' : 'inline' }}
                      >
                        {profile?.full_name?.charAt(0)?.toUpperCase() || 
                         user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </span>
                    <span className="user-name">
                      {profile?.full_name || user?.email?.split('@')[0] || 'Usuario'}
                    </span>
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  
                  <div className="dropdown-menu">
                    <button onClick={handleProfile} className="dropdown-item">
                      Mi Perfil
                    </button>
                    <div className="dropdown-divider"></div>
                    <button 
                      onClick={handleSignOut} 
                      className="dropdown-item logout-item"
                      disabled={isSigningOut}
                    >
                      {isSigningOut ? 'Cerrando...' : 'Cerrar Sesión'}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={handleAuth} className="button-a">
                  Iniciar Sesión
                </button>
              )}
            </div>
            <a href="https://discord.gg/GnJKBAwMCk" style={{ textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">
              <button className="button-discord">
                <FontAwesomeIcon icon={faDiscord} />
                Únete a Discord
              </button>
              </a>
          </div>

          {/* Mobile Toggle */}
          <button 
            className={`mobile-toggle ${isMenuOpen ? 'active' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

    </>
  );
};

export default Navbar;
