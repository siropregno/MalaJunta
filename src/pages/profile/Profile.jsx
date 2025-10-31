import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../hooks/useAuthContext'
import logger from '../../utils/logger'
import Info from '../../Components/Info/Info'
import Chars from '../../Components/Chars/Chars'
import Options from '../../Components/Options/Options'
import './Profile.css'

const Profile = () => {
  const { user, loading } = useAuthContext()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('info')
  const [timeoutReached, setTimeoutReached] = useState(false)

  // Timeout para evitar loading infinito
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutReached(true)
    }, 5000) // 5 segundos máximo

    return () => clearTimeout(timer)
  }, [])

  // Redirigir al home si no está autenticado
  useEffect(() => {
    if (!loading && !user && timeoutReached) {
      logger.nav('User not authenticated, redirecting to home')
      navigate('/')
    }
  }, [loading, user, timeoutReached, navigate])

  const handleTabClick = (tabName) => {
    setActiveTab(tabName)
  }

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'info':
        return <Info />
      case 'chars':
        return <Chars />
      case 'options':
        return <Options />
      default:
        return <Info />
    }
  }

  // Solo mostrar loading si realmente está cargando y no ha pasado el timeout
  if (loading && !user && !timeoutReached) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Cargando perfil...</p>
            <small style={{ marginTop: '1rem', opacity: 0.7 }}>
              Si esto tarda mucho, refresca la página
            </small>
          </div>
        </div>
      </div>
    )
  }

  // Si no hay usuario (no autenticado), mostrar loading mientras redirige
  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Redirigiendo...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className='content-header'>
        <h1 className="content-header-title">Mi Perfil</h1>
        <p className="content-header-subtitle">Aquí puedes ver y editar la información de tu cuenta.</p>
      </div>
      <div className="content-body">
        <div className='bar-options'>
          <ul>
            <li className={activeTab === 'info' ? 'active' : ''}>
              <a onClick={() => handleTabClick('info')}>Informacion</a>
            </li>
            <li className={activeTab === 'chars' ? 'active' : ''}>
              <a onClick={() => handleTabClick('chars')}>Personajes</a>
            </li>
            <li className={activeTab === 'options' ? 'active' : ''}>
              <a onClick={() => handleTabClick('options')}>Opciones</a>
            </li>
          </ul>
        </div>
        
        <div className="profile-content">
          {renderActiveComponent()}
        </div>
      </div>
    </>
  )
}

export default Profile
