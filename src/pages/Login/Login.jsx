import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../hooks/useAuthContext'
import logger from '../../utils/logger'
import './Login.css'

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn, signUp, user } = useAuthContext()
  const navigate = useNavigate()

  // Redirigir si ya está logueado
  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { error } = await signUp(formData.email, formData.password, formData.fullName)
        if (error) {
          setError(error.message)
        } else {
          // Registro exitoso, redirigir al home
          navigate('/')
        }
      } else {
        const { error } = await signIn(formData.email, formData.password)
        if (error) {
          setError(error.message)
        } else {
          // Login exitoso, redirigir al home
          navigate('/')
        }
      }
    } catch (err) {
      setError('Error inesperado. Inténtalo de nuevo.')
      logger.error('Auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setError('')
    setFormData({
      email: '',
      password: '',
      fullName: ''
    })
  }

  return (
    <>
    <div className="content-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <h1 className="login-title">
            {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h1>
          <p className="login-subtitle">
            {isSignUp 
              ? 'Únete a la comunidad MalaJunta' 
              : ''
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {isSignUp && (
            <div className="form-group">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="input-field"
                placeholder="Tu nombre completo"
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="Correo Electrónico"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              placeholder="Contraseña"
              required
              disabled={loading}
              minLength={6}
            />
            {isSignUp && (
              <small className="form-help">
                Mínimo 6 caracteres
              </small>
            )}
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`button-a ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                {isSignUp ? 'Creando cuenta...' : 'Iniciando sesión...'}
              </>
            ) : (
              isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="login-footer">
          <p className="toggle-text">
            {isSignUp 
              ? '¿Ya tienes cuenta?' 
              : '¿No tienes cuenta?'
            }
            <button
              type="button"
              onClick={toggleMode}
              className="toggle-btn"
              disabled={loading}
            >
              {isSignUp ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>
          </p>
        </div>

        {/* Back to Home */}
        <div className="back-home">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="back-btn"
            disabled={loading}
          >
            ← Volver al Inicio
          </button>
        </div>
      </div>
    </div>
    </>
  )
}

export default Login
