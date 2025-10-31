import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faHeart as faHeartSolid,
  faComment,
  faTrash,
  faPaperPlane,
  faTimes,
  faDownload,
  faTag
} from '@fortawesome/free-solid-svg-icons'
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons'
import { 
  togglePostLike, 
  getUserPostLike, 
  getPostComments, 
  createComment, 
  deleteComment,
  deleteMediaPost,
  getPostTags 
} from '../../lib/database'
import CommentItem from '../CommentItem/CommentItem'
import logger from '../../utils/logger'
import './MediaPost.css'

// Helper function to get initials from name
const getInitials = (name) => {
  if (!name) return 'U'
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

const MediaPost = ({ post, currentUser, onUpdate, onDelete }) => {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.like_count || 0)
  const [comments, setComments] = useState([])
  const [showImageModal, setShowImageModal] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [error, setError] = useState('')
  const [tags, setTags] = useState([])
  const [showTags, setShowTags] = useState(false)

  const checkUserLike = useCallback(async () => {
    try {
      const { data, error } = await getUserPostLike(currentUser.id, post.id)
      if (!error) {
        setIsLiked(data)
      }
    } catch (error) {
      logger.error('Error checking user like:', error)
    }
  }, [currentUser, post.id])

  const loadPostTags = useCallback(async () => {
    try {
      const { data, error } = await getPostTags(post.id)
      if (!error) {
        setTags(data || [])
      }
    } catch (error) {
      logger.error('Error loading post tags:', error)
    }
  }, [post.id])

  useEffect(() => {
    if (currentUser) {
      checkUserLike()
    }
    loadPostTags()
  }, [currentUser, post.id, checkUserLike, loadPostTags])

  const handleLike = async () => {
    if (!currentUser) {
      setError('Debes iniciar sesión para dar like')
      return
    }

    try {
      const { data, error } = await togglePostLike(currentUser.id, post.id)
      
      if (error) {
        logger.error('Error toggling like:', error)
        setError('Error al procesar el like')
      } else {
        const newIsLiked = data.action === 'liked'
        setIsLiked(newIsLiked)
        setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1)
        
        // Actualizar el post en el componente padre
        const updatedPost = {
          ...post,
          like_count: newIsLiked ? likeCount + 1 : likeCount - 1
        }
        onUpdate(updatedPost)
      }
    } catch (error) {
      logger.error('Unexpected error toggling like:', error)
      setError('Error inesperado al procesar el like')
    }
  }

  const loadComments = async () => {
    try {
      setLoadingComments(true)
      const { data, error } = await getPostComments(post.id)
      
      if (error) {
        logger.error('Error loading comments:', error)
        setError('Error al cargar los comentarios')
      } else {
        setComments(data || [])
      }
    } catch (error) {
      logger.error('Unexpected error loading comments:', error)
      setError('Error inesperado al cargar los comentarios')
    } finally {
      setLoadingComments(false)
    }
  }

  const handleShowComments = async () => {
    await loadComments()
    setShowImageModal(true)
  }

  const handleCloseModal = () => {
    setShowImageModal(false)
    setError('')
  }

  const handleDownloadImage = async () => {
    try {
      const response = await fetch(post.image_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `mala-junta-${post.id}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(url)
    } catch (error) {
      logger.error('Error downloading image:', error)
      setError('Error al descargar la imagen')
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    
    if (!currentUser) {
      setError('Debes iniciar sesión para comentar')
      return
    }

    if (!newComment.trim()) {
      setError('El comentario no puede estar vacío')
      return
    }

    if (newComment.length > 500) {
      setError('El comentario debe ser menor a 500 caracteres')
      return
    }

    try {
      setSubmittingComment(true)
      setError('')

      const { data, error } = await createComment(
        currentUser.id,
        post.id,
        newComment.trim()
      )

      if (error) {
        logger.error('Error creating comment:', error)
        setError('Error al crear el comentario')
      } else {
        // Agregar el nuevo comentario a la lista
        const newCommentWithStats = {
          ...data,
          author_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuario',
          author_avatar: null, // Se podría obtener del perfil si existe
          like_count: 0
        }
        
        setComments(prev => [...prev, newCommentWithStats])
        setNewComment('')
        
        // Actualizar contador de comentarios en el post
        const updatedPost = {
          ...post,
          comment_count: (post.comment_count || 0) + 1
        }
        onUpdate(updatedPost)
      }
    } catch (error) {
      logger.error('Unexpected error creating comment:', error)
      setError('Error inesperado al crear el comentario')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleCommentDelete = async (commentId) => {
    try {
      const { error } = await deleteComment(commentId)
      
      if (error) {
        logger.error('Error deleting comment:', error)
        setError('Error al eliminar el comentario')
      } else {
        setComments(prev => prev.filter(comment => comment.id !== commentId))
        
        // Actualizar contador de comentarios en el post
        const updatedPost = {
          ...post,
          comment_count: Math.max((post.comment_count || 0) - 1, 0)
        }
        onUpdate(updatedPost)
      }
    } catch (error) {
      logger.error('Unexpected error deleting comment:', error)
      setError('Error inesperado al eliminar el comentario')
    }
  }

  const handlePostDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      return
    }

    try {
      const { error } = await deleteMediaPost(post.id)
      
      if (error) {
        logger.error('Error deleting post:', error)
        setError('Error al eliminar la publicación')
      } else {
        onDelete(post.id)
      }
    } catch (error) {
      logger.error('Unexpected error deleting post:', error)
      setError('Error inesperado al eliminar la publicación')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Hace unos minutos'
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays < 7) {
        return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`
      } else {
        return date.toLocaleDateString()
      }
    }
  }

  const getAuthorInitials = (name, email) => {
    if (name && name.trim()) {
      const names = name.trim().split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase()
      }
      return names[0][0].toUpperCase()
    }
    return email ? email[0].toUpperCase() : 'U'
  }

  return (
    <div className="media-post">
      {/* Post Header */}
      <div className="post-header">
        <div className="author-info">
          <div className="author-avatar">
            {post.author_avatar ? (
              <img src={post.author_avatar} alt="Avatar" />
            ) : (
              <span className="avatar-initials">
                {getAuthorInitials(post.author_name, 'user@example.com')}
              </span>
            )}
          </div>
          <div className="author-details">
            <h4>{post.author_name || 'Usuario'}</h4>
            <span className="post-date">{formatDate(post.created_at)}</span>
          </div>
        </div>
        
        {currentUser && currentUser.id === post.user_id && (
          <button 
            className="delete-post-btn"
            onClick={handlePostDelete}
            title="Eliminar publicación"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        )}
      </div>

      {/* Post Image */}
      <div className="post-image-container">
        <div className="post-image" onClick={handleShowComments} style={{ cursor: 'pointer' }}>
          <img src={post.image_url} alt="Post" />
        </div>
      </div>

      {/* Post Description */}
      {post.description && (
        <div className="post-description">
          <p>{post.description}</p>
        </div>
      )}

      {/* Post Actions */}
      <div className="post-actions">
        <button 
          className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={!currentUser}
        >
          <FontAwesomeIcon icon={isLiked ? faHeartSolid : faHeartRegular} />
          <span>{likeCount}</span>
        </button>
        
        <button 
          className="action-btn comment-btn"
          onClick={handleShowComments}
        >
          <FontAwesomeIcon icon={faComment} />
          <span>{post.comment_count || 0}</span>
        </button>
        
        {tags.length > 0 && (
          <button 
            className={`action-btn tag-btn ${showTags ? 'active' : ''}`}
            onClick={() => setShowTags(!showTags)}
          >
            <FontAwesomeIcon icon={faTag} />
            <span>{tags.length}</span>
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="post-error">
          {error}
        </div>
      )}

      {/* Tagged Characters */}
      {showTags && tags.length > 0 && (
        <div className="post-tags">
          <h4>Personajes etiquetados:</h4>
          <div className="tags-list">
            {tags.map((tag, index) => (
              <div key={index} className="tag-item">
                <FontAwesomeIcon icon={faTag} />
                <span className="tag-name">{tag.character_name}</span>
                {tag.character_id && <small className="tag-source">(de tu colección)</small>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && createPortal(
        <div className="image-modal-overlay" onClick={handleCloseModal}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Close Button */}
            <button className="modal-close-btn" onClick={handleCloseModal} title="Cerrar">
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <div className="image-modal-content">
              {/* Left Side - Image */}
              <div className="modal-image-section">
                <div className="modal-image-container" style={{position: 'relative'}}>
                  <img src={post.image_url} alt="Post" />
                   {/* Etiquetados al pie de la imagen */}
                   {showTags && tags.length > 0 && (
                     <div className="modal-post-tags modal-tags-overlay">
                       <h4>Personajes etiquetados:</h4>
                       <div className="tags-list">
                         {tags.map((tag, index) => (
                           <div key={index} className="tag-item">
                             <FontAwesomeIcon icon={faTag} />
                             <span className="tag-name">{tag.character_name}</span>
                             {tag.character_id && <small className="tag-source">(de tu colección)</small>}
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                </div>
              </div>

              {/* Right Side - Comments */}
              <div className="modal-comments-section">
                {/* Post Header */}
                <div className="modal-post-header">
                  <div className="author-info">
                    <div className={`author-avatar ${post.author_avatar ? 'has-image' : ''}`}>
                      {post.author_avatar ? (
                        <img src={post.author_avatar} alt={post.author_name} />
                      ) : (
                        <span className="avatar-initials">
                          {getInitials(post.author_name)}
                        </span>
                      )}
                    </div>
                    <div className="author-details">
                      <h4>{post.author_name}</h4>
                      <span className="post-date">
                        {new Date(post.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Post Description */}
                {post.description && (
                  <div className="modal-post-description">
                    <p>{post.description}</p>
                  </div>
                )}

                {/* Comments List */}
                <div className="modal-comments-list">
                  {loadingComments ? (
                    <div className="loading-comments">
                      <p>Cargando comentarios...</p>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="no-comments">
                      <p>No hay comentarios aún</p>
                    </div>
                  ) : (
                    comments.map(comment => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        currentUser={currentUser}
                        onDelete={handleCommentDelete}
                      />
                    ))
                  )}
                </div>

                {/* Comment Form */}
                <div className="modal-comment-form">
                  {/* Post Actions */}
                  <div className="modal-post-actions">
                    <button 
                      className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
                      onClick={handleLike}
                      disabled={!currentUser}
                    >
                      <FontAwesomeIcon icon={isLiked ? faHeartSolid : faHeartRegular} />
                      <span>{likeCount}</span>
                    </button>
                    <button 
                      className="action-btn download-btn"
                      onClick={handleDownloadImage}
                      title="Descargar imagen"
                    >
                      <FontAwesomeIcon icon={faDownload} />
                    </button>
                    {tags.length > 0 && (
                      <button 
                        className={`action-btn tag-btn ${showTags ? 'active' : ''}`}
                        onClick={() => setShowTags(!showTags)}
                        title="Ver personajes etiquetados"
                      >
                        <FontAwesomeIcon icon={faTag} />
                        <span>{tags.length}</span>
                      </button>
                    )}
                  </div>

                  {/* Comment Input */}
                  {currentUser ? (
                    <form onSubmit={handleCommentSubmit} className="comment-form">
                      <div className="comment-input-group">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Escribe un comentario..."
                          rows="2"
                          maxLength="500"
                          disabled={submittingComment}
                        />
                        <button 
                          type="submit"
                          className="comment-submit-btn"
                          disabled={submittingComment || !newComment.trim()}
                        >
                          <FontAwesomeIcon icon={faPaperPlane} />
                        </button>
                      </div>
                      <small>{newComment.length}/500</small>
                    </form>
                  ) : (
                    <div className="login-prompt">
                      <p>Inicia sesión para comentar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="modal-error">
                {error}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default MediaPost