import React, { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faHeart as faHeartSolid,
  faTrash
} from '@fortawesome/free-solid-svg-icons'
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons'
import { toggleCommentLike, getUserCommentLike } from '../../lib/database'
import logger from '../../utils/logger'
import './CommentItem.css'

const CommentItem = ({ comment, currentUser, onDelete }) => {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(comment.like_count || 0)
  const [error, setError] = useState('')

  const checkUserLike = useCallback(async () => {
    try {
      const { data, error } = await getUserCommentLike(currentUser.id, comment.id)
      if (!error) {
        setIsLiked(data)
      }
    } catch (error) {
      logger.error('Error checking user comment like:', error)
    }
  }, [currentUser, comment.id])

  useEffect(() => {
    if (currentUser) {
      checkUserLike()
    }
  }, [currentUser, checkUserLike])

  const handleLike = async () => {
    if (!currentUser) {
      setError('Debes iniciar sesión para dar like')
      return
    }

    try {
      const { data, error } = await toggleCommentLike(currentUser.id, comment.id)
      
      if (error) {
        logger.error('Error toggling comment like:', error)
        setError('Error al procesar el like')
      } else {
        const newIsLiked = data.action === 'liked'
        setIsLiked(newIsLiked)
        setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1)
      }
    } catch (error) {
      logger.error('Unexpected error toggling comment like:', error)
      setError('Error inesperado al procesar el like')
    }
  }

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      onDelete(comment.id)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) {
      return 'Ahora'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m`
    } else {
      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours < 24) {
        return `${diffInHours}h`
      } else {
        const diffInDays = Math.floor(diffInHours / 24)
        return `${diffInDays}d`
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
    <div className="comment-item">
      <div className="comment-header">
        <div className="comment-author">
          <div className="comment-avatar">
            {comment.author_avatar ? (
              <img src={comment.author_avatar} alt="Avatar" />
            ) : (
              <span className="avatar-initials">
                {getAuthorInitials(comment.author_name, 'user@example.com')}
              </span>
            )}
          </div>
          <div className="comment-info">
            <span className="author-name">{comment.author_name || 'Usuario'}</span>
            <span className="comment-date">{formatDate(comment.created_at)}</span>
          </div>
        </div>
        
        {currentUser && currentUser.id === comment.user_id && (
          <button 
            className="delete-comment-btn"
            onClick={handleDelete}
            title="Eliminar comentario"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        )}
      </div>

      <div className="comment-content">
        <p>{comment.content}</p>
      </div>

      <div className="comment-actions">
        <button 
          className={`comment-like-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={!currentUser}
        >
          <FontAwesomeIcon icon={isLiked ? faHeartSolid : faHeartRegular} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
      </div>

      {error && (
        <div className="comment-error">
          {error}
        </div>
      )}
    </div>
  )
}

export default CommentItem