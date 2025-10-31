import React, { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faTimes, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons'
import { useAuthContext } from '../../hooks/useAuthContext'
import { createCharacter, getUserCharacters, deleteCharacter, updateCharacter } from '../../lib/database'
import logger from '../../utils/logger'
import './Chars.css'

const Chars = () => {
  const { user } = useAuthContext()
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', subclass: '' })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const loadCharacters = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const { data, error } = await getUserCharacters(user.id)
      
      if (error) {
        logger.error('Error loading characters:', error)
      } else {
        setCharacters(data || [])
      }
    } catch (error) {
      logger.error('Unexpected error loading characters:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Cargar personajes al montar el componente
  useEffect(() => {
    if (user) {
      loadCharacters()
    }
  }, [user, loadCharacters])

  const handleShowForm = () => {
    if (characters.length >= 9) {
      setFormError('Has alcanzado el límite máximo de 9 personajes')
      return
    }
    setShowForm(true)
    setFormError('')
    setFormData({ name: '', subclass: '' })
    setEditingId(null)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setFormData({ name: '', subclass: '' })
    setFormError('')
    setEditingId(null)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.subclass) {
      setFormError('Todos los campos son obligatorios')
      return
    }

    if (formData.name.trim().length < 2) {
      setFormError('El nombre debe tener al menos 2 caracteres')
      return
    }

    try {
      setSubmitting(true)
      
      if (editingId) {
        // Actualizar personaje existente
        const { data, error } = await updateCharacter(editingId, {
          name: formData.name.trim(),
          subclass: formData.subclass.trim()
        })
        
        if (error) {
          setFormError('Error al actualizar el personaje. Inténtalo de nuevo.')
          logger.error('Error updating character:', error)
        } else {
          setCharacters(prev => prev.map(char => 
            char.id === editingId ? data : char
          ))
          handleCloseForm()
        }
      } else {
        // Crear nuevo personaje
        const { data, error } = await createCharacter({
          user_id: user.id,
          name: formData.name.trim(),
          subclass: formData.subclass.trim()
        })
        
        if (error) {
          setFormError('Error al crear el personaje. Inténtalo de nuevo.')
          logger.error('Error creating character:', error)
        } else {
          setCharacters(prev => [...prev, data])
          handleCloseForm()
        }
      }
    } catch (error) {
      setFormError('Error inesperado. Inténtalo de nuevo.')
      logger.error('Unexpected error in form submission:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (character) => {
    setFormData({ name: character.name, subclass: character.subclass })
    setEditingId(character.id)
    setShowForm(true)
    setFormError('')
  }

  const handleDelete = async (characterId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este personaje?')) {
      return
    }

    try {
      const { error } = await deleteCharacter(characterId)
      
      if (error) {
        logger.error('Error deleting character:', error)
        alert('Error al eliminar el personaje. Inténtalo de nuevo.')
      } else {
        setCharacters(prev => prev.filter(char => char.id !== characterId))
      }
    } catch (error) {
      logger.error('Unexpected error deleting character:', error)
      alert('Error inesperado al eliminar el personaje.')
    }
  }

  if (loading) {
    return (
      <div className="chars-container">
        <div className="chars-content">
          <div className="loading-state">
            <p>Cargando personajes...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chars-container">

      <div className="chars-content">
        {characters.length === 0 ? (
          <div className="empty-state">
            <p>Aún no agregaste personajes</p>
            <button className="button-a-round" onClick={handleShowForm}>
              <span><FontAwesomeIcon icon={faPlus} /></span>
            </button>
          </div>
        ) : (
          <>
            <p>Gestiona tus personajes ({characters.length}/9)</p>
            <div className="characters-grid">
              {characters.map((character) => (
                <div key={character.id} className="character-card">
                  <div className="character-info">
                    <h3>{character.name}</h3>
                    <p className="character-subclass">{character.subclass}</p>
                  </div>
                  <div className="character-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEdit(character)}
                      title="Editar personaje"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(character.id)}
                      title="Eliminar personaje"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {characters.length < 9 && (
              <div className="add-character-section">
                <button className="button-a-round" onClick={handleShowForm}>
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="character-form-modal">
            <div className="form-header">
              <h3>{editingId ? 'Editar Personaje' : 'Nuevo Personaje'}</h3>
              <button className="close-btn" onClick={handleCloseForm}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="character-form">
              {formError && (
                <div className="form-error">
                  {formError}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="name">Nombre del Personaje</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ingresa el nombre del personaje"
                  maxLength="50"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="subclass">Subclase</label>
                <select
                  id="subclass"
                  name="subclass"
                  value={formData.subclass}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecciona una subclase</option>
                  <option value="Barbaro">Bárbaro</option>
                  <option value="Brujo">Brujo</option>
                  <option value="Caballero">Caballero</option>
                  <option value="Cazador">Cazador</option>
                  <option value="Conjurador">Conjurador</option>
                  <option value="Tirador">Tirador</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={handleCloseForm}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : (editingId ? 'Actualizar' : 'Añadir personaje')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Chars
