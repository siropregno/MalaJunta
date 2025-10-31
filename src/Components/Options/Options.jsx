import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../hooks/useAuthContext'
import logger from '../../utils/logger'
import './Options.css'

const Options = () => {
  const { deleteAccount } = useAuthContext()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDeleteAccount = async () => {
    const confirmMessage = '¿Estás absolutamente seguro de que quieres eliminar tu cuenta?\n\nEsta acción NO se puede deshacer. Se eliminarán:\n- Tu perfil\n- Tu foto de perfil\n- Todos tus datos\n\nEscribe "ELIMINAR" para confirmar:'
    
    const userConfirmation = window.prompt(confirmMessage)
    
    if (userConfirmation !== 'ELIMINAR') {
      return
    }

    const finalConfirm = window.confirm('Última confirmación: ¿Realmente quieres eliminar tu cuenta para siempre?')
    if (!finalConfirm) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { error } = await deleteAccount()
      
      if (error) {
        setError(error.message || 'Error eliminando la cuenta')
      } else {
        alert('Tu cuenta ha sido eliminada exitosamente.')
        navigate('/')
      }
    } catch (err) {
      setError('Error inesperado al eliminar la cuenta')
      logger.error('Error deleting account:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="options-container">

      {/* Configuraciones generales */}
      <div className="options-section">
        <h3>Preferencias</h3>
        <div className="option-item">
          <div className="option-info">
            <h4>Tema Oscuro</h4>
            <p>Cambiar entre tema claro y oscuro</p>
          </div>
          <button className="button-b" disabled>
            Próximamente
          </button>
        </div>
        
        <div className="option-item">
          <div className="option-info">
            <h4>Notificaciones</h4>
            <p>Configurar notificaciones por email</p>
          </div>
          <button className="button-b" disabled>
            Próximamente
          </button>
        </div>
        
        <div className="option-item">
          <div className="option-info">
            <h4>Idioma</h4>
            <p>Cambiar idioma de la aplicación</p>
          </div>
          <button className="button-b" disabled>
            Próximamente
          </button>
        </div>
      </div>

      {/* Privacidad y seguridad */}
      <div className="options-section">
        <h3>Privacidad y Seguridad</h3>
        <div className="option-item">
          <div className="option-info">
            <h4>Cambiar Contraseña</h4>
            <p>Actualizar tu contraseña de acceso</p>
          </div>
          <button className="button-b" disabled>
            Próximamente
          </button>
        </div>
        
        <div className="option-item">
          <div className="option-info">
            <h4>Autenticación 2FA</h4>
            <p>Configurar autenticación de dos factores</p>
          </div>
          <button className="button-b" disabled>
            Próximamente
          </button>
        </div>
      </div>

      {/* Exportar datos */}
      <div className="options-section">
        <h3>Datos</h3>
        <div className="option-item">
          <div className="option-info">
            <h4>Exportar Datos</h4>
            <p>Descargar una copia de todos tus datos</p>
          </div>
          <button className="button-b" disabled>
            Próximamente
          </button>
        </div>
      </div>

      {/* Zona de peligro */}
      <div className="danger-zone">
        <h3>Zona de Peligro</h3>
        <div className="danger-content">
          <div className="danger-item">
            <div className="danger-info">
              <h4>Eliminar Cuenta</h4>
              <p>Esta acción eliminará permanentemente tu cuenta y todos tus datos asociados. No se puede deshacer.</p>
            </div>
            
            {error && (
              <div className="message error">
                {error}
              </div>
            )}
            
            <button
              onClick={handleDeleteAccount}
              className="button-danger"
              disabled={isLoading}
            >
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Options
