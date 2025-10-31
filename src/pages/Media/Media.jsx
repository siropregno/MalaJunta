import React, { useState, useEffect } from 'react'
import { useAuthContext } from '../../hooks/useAuthContext'
import { getAllMediaPosts, createMediaPost, searchCharacters } from '../../lib/database'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faImage, faTimes, faSearch, faTag } from '@fortawesome/free-solid-svg-icons'
import MediaPost from '../../Components/MediaPost/MediaPost'
import logger from '../../utils/logger'
import './Media.css'

const Media = () => {
  const { user, isAuthenticated } = useAuthContext()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadData, setUploadData] = useState({
    file: null,
    description: '',
    preview: null,
    tags: []
  })
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [characterSearch, setCharacterSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showCharacterSearch, setShowCharacterSearch] = useState(false)

  // Cargar posts al montar el componente
  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const { data, error } = await getAllMediaPosts()
      
      if (error) {
        logger.error('Error loading posts:', error)
        setError('Error al cargar las publicaciones')
      } else {
        setPosts(data || [])
      }
    } catch (error) {
      logger.error('Unexpected error loading posts:', error)
      setError('Error inesperado al cargar las publicaciones')
    } finally {
      setLoading(false)
    }
  }

  const handleShowUploadModal = () => {
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para subir fotos')
      return
    }
    setShowUploadModal(true)
    setError('')
  }

  const handleCloseUploadModal = () => {
    setShowUploadModal(false)
    setUploadData({ file: null, description: '', preview: null, tags: [] })
    setError('')
    setCharacterSearch('')
    setSearchResults([])
    setShowCharacterSearch(false)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido')
      return
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen debe ser menor a 10MB')
      return
    }

    // Crear preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadData(prev => ({
        ...prev,
        file,
        preview: e.target.result
      }))
    }
    reader.readAsDataURL(file)
    setError('')
  }

  const handleDescriptionChange = (e) => {
    setUploadData(prev => ({
      ...prev,
      description: e.target.value
    }))
  }

  const handleCharacterSearch = async (searchTerm) => {
    setCharacterSearch(searchTerm)
    
    if (searchTerm.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const { data, error } = await searchCharacters(searchTerm)
      if (error) {
        logger.error('Error searching characters:', error)
      } else {
        setSearchResults(data || [])
      }
    } catch (error) {
      logger.error('Unexpected error searching characters:', error)
    }
  }

  const handleAddCharacterTag = (character) => {
    // Verificar si el personaje ya está etiquetado
    const isAlreadyTagged = uploadData.tags.some(tag => 
      tag.character_id === character.id
    )
    
    if (isAlreadyTagged) {
      setError('Este personaje ya está etiquetado')
      return
    }

    setUploadData(prev => ({
      ...prev,
      tags: [...prev.tags, {
        character_id: character.id,
        character_name: character.name,
        position_x: 0.5, // Posición por defecto en el centro
        position_y: 0.5
      }]
    }))
    
    setCharacterSearch('')
    setSearchResults([])
    setShowCharacterSearch(false)
    setError('')
  }

  const handleAddCustomTag = (name) => {
    if (!name.trim()) return

    // Verificar si ya existe un tag con ese nombre
    const isAlreadyTagged = uploadData.tags.some(tag => 
      tag.character_name.toLowerCase() === name.toLowerCase()
    )
    
    if (isAlreadyTagged) {
      setError('Ya existe un tag con ese nombre')
      return
    }

    setUploadData(prev => ({
      ...prev,
      tags: [...prev.tags, {
        character_id: null,
        character_name: name.trim(),
        position_x: 0.5,
        position_y: 0.5
      }]
    }))
    
    setCharacterSearch('')
    setSearchResults([])
    setShowCharacterSearch(false)
    setError('')
  }

  const handleRemoveTag = (tagIndex) => {
    setUploadData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== tagIndex)
    }))
  }

  const handleUpload = async () => {
    if (!uploadData.file) {
      setError('Por favor selecciona una imagen')
      return
    }

    if (uploadData.description.length > 500) {
      setError('La descripción debe ser menor a 500 caracteres')
      return
    }

    try {
      setUploading(true)
      setError('')

      const { error } = await createMediaPost(
        user.id,
        uploadData.file,
        uploadData.description,
        uploadData.tags
      )

      if (error) {
        setError('Error al subir la publicación')
        logger.error('Error uploading post:', error)
      } else {
        logger.success('Post uploaded successfully')
        handleCloseUploadModal()
        // Recargar posts para mostrar el nuevo
        await loadPosts()
      }
    } catch (error) {
      setError('Error inesperado al subir la publicación')
      logger.error('Unexpected error uploading post:', error)
    } finally {
      setUploading(false)
    }
  }

  const handlePostUpdate = (updatedPost) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      )
    )
  }

  const handlePostDelete = (deletedPostId) => {
    setPosts(prevPosts => 
      prevPosts.filter(post => post.id !== deletedPostId)
    )
  }

  if (loading) {
    return (
      <>
        <div className='content-header'>
          <h1 className="content-header-title">Media</h1>
          <p className="content-header-subtitle">Compartiendo momentos de la comunidad</p>
        </div>
        <div className="content-body">
          <div className="loading-state">
            <p>Cargando publicaciones...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Header */}
      <div className='content-header'>
        <h1 className="content-header-title">Media</h1>
        <p className="content-header-subtitle">Compartiendo momentos de la comunidad</p>
        {isAuthenticated && (
          <button 
            className="upload-button"
            onClick={handleShowUploadModal}
          >
            <FontAwesomeIcon icon={faPlus} />
            Subir Foto
          </button>
        )}
      </div>

      <div className="content-body">
        {/* Error Display */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Posts Feed */}
        <div className="media-feed">
        {posts.length === 0 ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faImage} className="empty-icon" />
            <h3>No hay publicaciones aún</h3>
            <p>¡Sé el primero en compartir una foto!</p>
            {isAuthenticated && (
              <button className="button-a" onClick={handleShowUploadModal}>
                <FontAwesomeIcon icon={faPlus} />
                Subir Primera Foto
              </button>
            )}
          </div>
        ) : (
          posts.map(post => (
            <MediaPost 
              key={post.id} 
              post={post} 
              currentUser={user}
              onUpdate={handlePostUpdate}
              onDelete={handlePostDelete}
            />
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="upload-modal">
            <div className="modal-header">
              <h3>Subir Nueva Foto</h3>
              <button 
                className="close-btn"
                onClick={handleCloseUploadModal}
                disabled={uploading}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-content">
              {error && (
                <div className="form-error">
                  {error}
                </div>
              )}

              {/* File Input */}
              <div className="upload-section">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                  id="image-upload"
                  disabled={uploading}
                />
                <label htmlFor="image-upload" className="file-label">
                  {uploadData.preview ? (
                    <div className="image-preview">
                      <img src={uploadData.preview} alt="Preview" />
                      <div className="change-overlay">
                        <FontAwesomeIcon icon={faImage} />
                        <span>Cambiar imagen</span>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <FontAwesomeIcon icon={faImage} />
                      <span>Seleccionar imagen</span>
                      <small>Máximo 10MB</small>
                    </div>
                  )}
                </label>
              </div>

              {/* Description Input */}
              <div className="description-section">
                <label htmlFor="description">Descripción (opcional)</label>
                <textarea
                  id="description"
                  value={uploadData.description}
                  onChange={handleDescriptionChange}
                  placeholder="Escribe una descripción para tu foto..."
                  maxLength="500"
                  rows="3"
                  disabled={uploading}
                />
                <small>{uploadData.description.length}/500</small>
              </div>

              {/* Character Tagging Section */}
              <div className="tagging-section">
                <div className="section-header">
                  <label>
                    <FontAwesomeIcon icon={faTag} />
                    Etiquetar Personajes
                  </label>
                  <button 
                    type="button"
                    className="add-tag-btn"
                    onClick={() => setShowCharacterSearch(!showCharacterSearch)}
                    disabled={uploading}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Agregar Tag
                  </button>
                </div>

                {/* Current Tags */}
                {uploadData.tags.length > 0 && (
                  <div className="current-tags">
                    {uploadData.tags.map((tag, index) => (
                      <div key={index} className="tag-item">
                        <span className="tag-name">
                          {tag.character_name}
                          {tag.character_id && <small> (de tu colección)</small>}
                        </span>
                        <button
                          type="button"
                          className="remove-tag-btn"
                          onClick={() => handleRemoveTag(index)}
                          disabled={uploading}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Character Search */}
                {showCharacterSearch && (
                  <div className="character-search">
                    <div className="search-input-wrapper">
                      <FontAwesomeIcon icon={faSearch} className="search-icon" />
                      <input
                        type="text"
                        placeholder="Buscar personaje o escribir nombre nuevo..."
                        value={characterSearch}
                        onChange={(e) => handleCharacterSearch(e.target.value)}
                        disabled={uploading}
                        className="search-input"
                      />
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="search-results">
                        <div className="results-header">Personajes de tu colección:</div>
                        {searchResults.map(character => (
                          <button
                            key={character.id}
                            type="button"
                            className="character-result"
                            onClick={() => handleAddCharacterTag(character)}
                            disabled={uploading}
                          >
                            <span className="character-name">{character.name}</span>
                            <small className="character-info">
                              {character.series} • {character.rarity}
                            </small>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Add Custom Tag Option */}
                    {characterSearch.length >= 2 && (
                      <div className="custom-tag-option">
                        <button
                          type="button"
                          className="add-custom-tag"
                          onClick={() => handleAddCustomTag(characterSearch)}
                          disabled={uploading}
                        >
                          <FontAwesomeIcon icon={faTag} />
                          Agregar "{characterSearch}" como tag personalizado
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="modal-actions">
                <button 
                  className="button-b"
                  onClick={handleCloseUploadModal}
                  disabled={uploading}
                >
                  Cancelar
                </button>
                <button 
                  className="button-a"
                  onClick={handleUpload}
                  disabled={uploading || !uploadData.file}
                >
                  {uploading ? 'Subiendo...' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}

export default Media