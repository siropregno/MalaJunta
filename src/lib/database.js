// Script para verificar y crear la tabla profiles automáticamente
import { supabase } from './supabase.js'
import logger from '../utils/logger.js'

export const initializeDatabase = async () => {
  try {
    logger.db('Checking database configuration')
    
    // 1. Verificar si la tabla profiles existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'profiles')
    
    if (tablesError) {
      logger.error('Error checking tables:', tablesError)
      return false
    }
    
    if (!tables || tables.length === 0) {
      logger.warn('Profiles table not found. Manual creation required.')
      logger.info('Run this SQL in your Supabase dashboard:', `
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
      `)
      return false
    }
    
    logger.success('Profiles table found')
    return true
    
  } catch (error) {
    logger.error('Error initializing database:', error)
    return false
  }
}

export const createUserProfile = async (user) => {
  try {
    logger.db('Creating profile for user', { email: user.email })
    
    const profileData = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      avatar_url: user.user_metadata?.avatar_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single()
    
    if (error) {
      logger.error('Error creating profile:', error)
      return { data: null, error }
    }
    
    logger.success('Profile created successfully')
    return { data, error: null }
    
  } catch (error) {
    logger.error('Unexpected error creating profile:', error)
    return { data: null, error }
  }
}

// Funciones para manejar personajes
export const createCharacter = async (characterData) => {
  try {
    logger.db('Creating character', { name: characterData.name, subclass: characterData.subclass })
    
    const { data, error } = await supabase
      .from('characters')
      .insert([{
        user_id: characterData.user_id,
        name: characterData.name,
        subclass: characterData.subclass
      }])
      .select()
      .single()
    
    if (error) {
      logger.error('Error creating character:', error)
      return { data: null, error }
    }
    
    logger.success('Character created successfully')
    return { data, error: null }
    
  } catch (error) {
    logger.error('Unexpected error creating character:', error)
    return { data: null, error }
  }
}

export const getUserCharacters = async (userId) => {
  try {
    logger.db('Getting characters for user', { userId })
    
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    
    if (error) {
      logger.error('Error getting characters:', error)
      return { data: null, error }
    }
    
    logger.success('Characters retrieved successfully', { count: data?.length || 0 })
    return { data: data || [], error: null }
    
  } catch (error) {
    logger.error('Unexpected error getting characters:', error)
    return { data: null, error }
  }
}

export const updateCharacter = async (characterId, updates) => {
  try {
    logger.db('Updating character', { characterId, updates })
    
    const { data, error } = await supabase
      .from('characters')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', characterId)
      .select()
      .single()
    
    if (error) {
      logger.error('Error updating character:', error)
      return { data: null, error }
    }
    
    logger.success('Character updated successfully')
    return { data, error: null }
    
  } catch (error) {
    logger.error('Unexpected error updating character:', error)
    return { data: null, error }
  }
}

export const deleteCharacter = async (characterId) => {
  try {
    logger.db('Deleting character', { characterId })
    
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', characterId)
    
    if (error) {
      logger.error('Error deleting character:', error)
      return { error }
    }
    
    logger.success('Character deleted successfully')
    return { error: null }
    
  } catch (error) {
    logger.error('Unexpected error deleting character:', error)
    return { error }
  }
}

// ====================================================
// FUNCIONES PARA EL SISTEMA DE MEDIA SOCIAL
// ====================================================

// Funciones para Media Posts
export const createMediaPost = async (userId, imageFile, description = '', tags = []) => {
  try {
    logger.db('Creating media post', { userId, description })
    
    // 1. Subir imagen al storage
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('media-images')
      .upload(fileName, imageFile)
    
    if (uploadError) {
      logger.error('Error uploading image:', uploadError)
      return { data: null, error: uploadError }
    }
    
    // 2. Obtener URL pública de la imagen
    const { data: { publicUrl } } = supabase.storage
      .from('media-images')
      .getPublicUrl(fileName)
    
    // 3. Crear el post en la base de datos
    const { data, error } = await supabase
      .from('media_posts')
      .insert([{
        user_id: userId,
        image_url: publicUrl,
        description: description.trim()
      }])
      .select()
      .single()
    
    if (error) {
      logger.error('Error creating media post:', error)
      return { data: null, error }
    }
    
    // 4. Crear las etiquetas si las hay
    if (tags && tags.length > 0) {
      const { error: tagsError } = await createPostTags(data.id, tags)
      if (tagsError) {
        logger.warn('Error creating post tags:', tagsError)
        // No retornamos error aquí porque el post ya se creó exitosamente
      }
    }
    
    logger.success('Media post created successfully')
    return { data, error: null }
    
  } catch (error) {
    logger.error('Unexpected error creating media post:', error)
    return { data: null, error }
  }
}

export const getAllMediaPosts = async () => {
  try {
    logger.db('Getting all media posts')
    
    const { data, error } = await supabase
      .from('media_posts_with_stats')
      .select('*')
    
    if (error) {
      logger.error('Error getting media posts:', error)
      return { data: null, error }
    }
    
    logger.success('Media posts retrieved successfully', { count: data?.length || 0 })
    return { data: data || [], error: null }
    
  } catch (error) {
    logger.error('Unexpected error getting media posts:', error)
    return { data: null, error }
  }
}

export const getUserMediaPosts = async (userId) => {
  try {
    logger.db('Getting media posts for user', { userId })
    
    const { data, error } = await supabase
      .from('media_posts_with_stats')
      .select('*')
      .eq('user_id', userId)
    
    if (error) {
      logger.error('Error getting user media posts:', error)
      return { data: null, error }
    }
    
    logger.success('User media posts retrieved successfully', { count: data?.length || 0 })
    return { data: data || [], error: null }
    
  } catch (error) {
    logger.error('Unexpected error getting user media posts:', error)
    return { data: null, error }
  }
}

export const deleteMediaPost = async (postId) => {
  try {
    logger.db('Deleting media post', { postId })
    
    const { error } = await supabase
      .from('media_posts')
      .delete()
      .eq('id', postId)
    
    if (error) {
      logger.error('Error deleting media post:', error)
      return { error }
    }
    
    logger.success('Media post deleted successfully')
    return { error: null }
    
  } catch (error) {
    logger.error('Unexpected error deleting media post:', error)
    return { error }
  }
}

// Funciones para Likes de Posts
export const togglePostLike = async (userId, postId) => {
  try {
    logger.db('Toggling post like', { userId, postId })
    
    // Verificar si ya existe el like
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      logger.error('Error checking existing like:', checkError)
      return { data: null, error: checkError }
    }
    
    if (existingLike) {
      // Remove like
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('id', existingLike.id)
      
      if (deleteError) {
        logger.error('Error removing like:', deleteError)
        return { data: null, error: deleteError }
      }
      
      logger.success('Like removed successfully')
      return { data: { action: 'unliked' }, error: null }
    } else {
      // Add like
      const { error } = await supabase
        .from('post_likes')
        .insert([{ user_id: userId, post_id: postId }])
        .select()
        .single()
      
      if (error) {
        logger.error('Error adding like:', error)
        return { data: null, error }
      }
      
      logger.success('Like added successfully')
      return { data: { action: 'liked' }, error: null }
    }
    
  } catch (error) {
    logger.error('Unexpected error toggling post like:', error)
    return { data: null, error }
  }
}

export const getUserPostLike = async (userId, postId) => {
  try {
    const { data, error } = await supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      logger.error('Error getting user post like:', error)
      return { data: null, error }
    }
    
    return { data: data ? true : false, error: null }
    
  } catch (error) {
    logger.error('Unexpected error getting user post like:', error)
    return { data: null, error }
  }
}

// Funciones para Comentarios
export const createComment = async (userId, postId, content) => {
  try {
    logger.db('Creating comment', { userId, postId, content: content.substring(0, 50) + '...' })
    
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        user_id: userId,
        post_id: postId,
        content: content.trim()
      }])
      .select()
      .single()
    
    if (error) {
      logger.error('Error creating comment:', error)
      return { data: null, error }
    }
    
    logger.success('Comment created successfully')
    return { data, error: null }
    
  } catch (error) {
    logger.error('Unexpected error creating comment:', error)
    return { data: null, error }
  }
}

export const getPostComments = async (postId) => {
  try {
    logger.db('Getting comments for post', { postId })
    
    const { data, error } = await supabase
      .from('comments_with_stats')
      .select('*')
      .eq('post_id', postId)
    
    if (error) {
      logger.error('Error getting post comments:', error)
      return { data: null, error }
    }
    
    logger.success('Post comments retrieved successfully', { count: data?.length || 0 })
    return { data: data || [], error: null }
    
  } catch (error) {
    logger.error('Unexpected error getting post comments:', error)
    return { data: null, error }
  }
}

export const deleteComment = async (commentId) => {
  try {
    logger.db('Deleting comment', { commentId })
    
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
    
    if (error) {
      logger.error('Error deleting comment:', error)
      return { error }
    }
    
    logger.success('Comment deleted successfully')
    return { error: null }
    
  } catch (error) {
    logger.error('Unexpected error deleting comment:', error)
    return { error }
  }
}

// Funciones para Likes de Comentarios
export const toggleCommentLike = async (userId, commentId) => {
  try {
    logger.db('Toggling comment like', { userId, commentId })
    
    // Verificar si ya existe el like
    const { data: existingLike, error: checkError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('comment_id', commentId)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      logger.error('Error checking existing comment like:', checkError)
      return { data: null, error: checkError }
    }
    
    if (existingLike) {
      // Remove like
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('id', existingLike.id)
      
      if (deleteError) {
        logger.error('Error removing comment like:', deleteError)
        return { data: null, error: deleteError }
      }
      
      logger.success('Comment like removed successfully')
      return { data: { action: 'unliked' }, error: null }
    } else {
      // Add like
      const { error } = await supabase
        .from('comment_likes')
        .insert([{ user_id: userId, comment_id: commentId }])
        .select()
        .single()
      
      if (error) {
        logger.error('Error adding comment like:', error)
        return { data: null, error }
      }
      
      logger.success('Comment like added successfully')
      return { data: { action: 'liked' }, error: null }
    }
    
  } catch (error) {
    logger.error('Unexpected error toggling comment like:', error)
    return { data: null, error }
  }
}

export const getUserCommentLike = async (userId, commentId) => {
  try {
    const { data, error } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('comment_id', commentId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      logger.error('Error getting user comment like:', error)
      return { data: null, error }
    }
    
    return { data: data ? true : false, error: null }
    
  } catch (error) {
    logger.error('Unexpected error getting user comment like:', error)
    return { data: null, error }
  }
}

// ===== CHARACTER TAGGING FUNCTIONS =====

/**
 * Busca personajes por nombre (búsqueda difusa)
 */
export const searchCharacters = async (searchTerm) => {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase
      .from('characters')
      .select('id, name, subclass, user_id')
      .ilike('name', `%${searchTerm.trim()}%`)
      .limit(10)
    
    if (error) {
      logger.error('Error searching characters:', error)
      return { data: [], error }
    }
    
    return { data: data || [], error: null }
    
  } catch (error) {
    logger.error('Unexpected error searching characters:', error)
    return { data: [], error }
  }
}

/**
 * Crea las etiquetas de personajes para un post
 */
export const createPostTags = async (postId, tags) => {
  try {
    if (!tags || tags.length === 0) {
      return { data: [], error: null }
    }

    const tagsToInsert = tags.map(tag => ({
      post_id: postId,
      character_id: tag.character_id || null,
      character_name: tag.character_name,
        position_x: tag.position_x || 0,
        position_y: tag.position_y || 0
    }))

    const { data, error } = await supabase
      .from('post_tags')
      .insert(tagsToInsert)
      .select()
    
    if (error) {
      logger.error('Error creating post tags:', error)
      return { data: [], error }
    }
    
    logger.success('Post tags created successfully')
    return { data: data || [], error: null }
    
  } catch (error) {
    logger.error('Unexpected error creating post tags:', error)
    return { data: [], error }
  }
}

/**
 * Obtiene las etiquetas de un post
 */
export const getPostTags = async (postId) => {
  try {
    const { data, error } = await supabase
      .from('post_tags')
      .select(`
        id,
        character_name,
          position_x,
          position_y,
        character_id,
        characters (
          name,
          subclass
        )
      `)
      .eq('post_id', postId)
    
    if (error) {
      logger.error('Error getting post tags:', error)
      return { data: [], error }
    }
    
    return { data: data || [], error: null }
    
  } catch (error) {
    logger.error('Unexpected error getting post tags:', error)
    return { data: [], error }
  }
}

/**
 * Elimina las etiquetas de un post
 */
export const deletePostTags = async (postId) => {
  try {
    const { error } = await supabase
      .from('post_tags')
      .delete()
      .eq('post_id', postId)
    
    if (error) {
      logger.error('Error deleting post tags:', error)
      return { error }
    }
    
    logger.success('Post tags deleted successfully')
    return { error: null }
    
  } catch (error) {
    logger.error('Unexpected error deleting post tags:', error)
    return { error }
  }
}