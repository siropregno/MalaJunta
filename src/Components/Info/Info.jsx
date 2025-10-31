import React, { useState, useEffect } from 'react'
import { useAuthContext } from '../../hooks/useAuthContext'
import { supabase } from '../../lib/supabase'
import logger from '../../utils/logger'
import './Info.css'

const Info = () => {
  const { user, profile, updateProfile, uploadAvatar, deleteAvatar, loading } = useAuthContext()
  const [formData, setFormData] = useState({
    fullName: '',
    email: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [error, setError] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: profile?.full_name || user.user_metadata?.full_name || '',
        email: user.email || ''
      })
    }
  }, [user, profile])

  const showSuccessToast = (message) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
      setTimeout(() => setToastMessage(''), 300) // Tiempo para la animación de salida
    }, 3000)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { error } = await updateProfile({
        full_name: formData.fullName
      })

      if (error) {
        setError(error.message)
      } else {
        showSuccessToast('Perfil actualizado correctamente')
        setIsEditing(false)
      }
    } catch (err) {
      setError('Error inesperado al actualizar el perfil')
      logger.error('Error updating profile:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setError('')
    if (user && profile) {
      setFormData({
        fullName: profile.full_name || '',
        email: user.email || ''
      })
    }
  }

  const getInitials = (name, email) => {
    if (name && name.trim()) {
      const names = name.trim().split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase()
      }
      return names[0][0].toUpperCase()
    }
    return email ? email[0].toUpperCase() : 'U'
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target.result)
    }
    reader.readAsDataURL(file)

    handleAvatarUpload(file)
  }

  const handleAvatarUpload = async (file) => {
    setIsUploadingAvatar(true)
    setError('')

    try {
      const { error } = await uploadAvatar(file)
      
      if (error) {
        setError(error.message || 'Error subiendo la imagen')
      } else {
        showSuccessToast('Avatar actualizado correctamente')
      }
    } catch {
      setError('Error inesperado al subir la imagen')
    } finally {
      setIsUploadingAvatar(false)
      setAvatarPreview(null)
    }
  }

  const handleDeleteAvatar = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')) {
      return
    }

    setIsUploadingAvatar(true)
    setError('')

    try {
      const { error } = await deleteAvatar()
      
      if (error) {
        setError(error.message || 'Error eliminando la imagen')
      } else {
        showSuccessToast('Avatar eliminado correctamente')
      }
    } catch {
      setError('Error inesperado al eliminar la imagen')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="info-container">
      {/* Avatar Section */}
      <div className="avatar-section">
        <div className={`avatar-circle ${(avatarPreview || profile?.avatar_url) ? 'has-image' : ''}`}>
          {avatarPreview ? (
            <img src={avatarPreview} alt="Preview" className="avatar-img" />
          ) : profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt="Avatar" 
              className="avatar-img"
            />
          ) : (
            <span className="avatar-initials">
              {getInitials(formData.fullName, formData.email)}
            </span>
          )}
          {isUploadingAvatar && (
            <div className="avatar-loading">
              <div className="spinner"></div>
            </div>
          )}
        </div>
        
        <div className="avatar-actions">
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="avatar-input"
            id="avatar-upload"
            disabled={isUploadingAvatar}
          />
          <label htmlFor="avatar-upload" className="button-a">
            {isUploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}
          </label>
          {profile?.avatar_url && (
            <button
              onClick={handleDeleteAvatar}
              className="button-b"
              disabled={isUploadingAvatar}
            >
              Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Correo electrónico</label>
          <input
            type="email"
            className="input-field"
            value={formData.email}
            disabled
            readOnly
          />
        </div>

        <div className="form-group">
          <label>Nombre de usuario</label>
          <input
            type="text"
            className="input-field"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Tu nombre de usuario"
            disabled={!isEditing || isLoading}
            required
          />
        </div>

        {error && (
          <div className="message error">
            {error}
          </div>
        )}



        <div className="form-actions">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="button-a"
            >
              Editar perfil
            </button>
          ) : (
            <div className="button-group">
              <button
                type="submit"
                className="button-a"
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="button-b"
                disabled={isLoading}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Account Info */}
      <div className="account-info">
        <div className="info-item">
          <span className="label">Miembro desde</span>
          <span className="value">{formatDate(profile?.created_at)}</span>
        </div>
      </div>

      {/* Debug Section - Solo si no hay perfil */}
      {user && !profile && !loading && (
        <div className="debug-section">
          <p>Perfil no encontrado. Es necesario crear el perfil en la base de datos.</p>
          <button
            onClick={async () => {
              setIsLoading(true)
              setError('')
              
              try {
                const defaultProfile = {
                  id: user.id,
                  email: user.email,
                  full_name: user.user_metadata?.full_name || '',
                  avatar_url: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
                
                const { error } = await supabase
                  .from('profiles')
                  .insert([defaultProfile])
                  .select()
                  .single()
                
                if (error) {
                  setError('Error: ' + error.message)
                } else {
                  showSuccessToast('Perfil creado exitosamente')
                  setTimeout(() => window.location.reload(), 1500)
                }
              } catch {
                setError('Error inesperado')
              } finally {
                setIsLoading(false)
              }
            }}
            className="button-a"
            disabled={isLoading}
          >
            {isLoading ? 'Creando...' : 'Crear perfil'}
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className={`toast ${showToast ? 'toast-show' : ''}`}>
          <div className="toast-content">
            <span className="toast-icon">✓</span>
            <span className="toast-message">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default Info
