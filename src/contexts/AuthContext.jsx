import React, { createContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import logger from '../utils/logger'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    logger.auth('Initializing AuthContext')
    
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        logger.auth('Getting initial session')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          logger.error('Error getting session:', error)
        } else {
          logger.auth('Initial session result', {
            hasSession: !!session,
            hasUser: !!session?.user,
            userEmail: session?.user?.email
          })
          
          setSession(session)
          setUser(session?.user ?? null)
          
          // Si hay usuario, cargar perfil sin bloquear
          if (session?.user) {
            loadUserProfile(session.user.id) // Sin await
          }
        }
      } catch (error) {
        logger.error('Error in getInitialSession:', error)
      } finally {
        logger.auth('Initial loading complete, setting loading to false')
        setLoading(false)
      }
    }

    getInitialSession()

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.auth('Auth state changed', { event, userEmail: session?.user?.email })
        
        setSession(session)
        setUser(session?.user ?? null)

        // Establecer loading como false INMEDIATAMENTE
        logger.auth('Setting loading to false immediately')
        setLoading(false)

        // Cargar perfil en paralelo sin bloquear
        if (session?.user) {
          loadUserProfile(session.user.id) // Sin await para no bloquear
        } else {
          setProfile(null)
        }

        logger.auth('Auth state change processing complete')
      }
    )

    return () => {
      logger.auth('Cleaning up subscription')
      subscription.unsubscribe()
    }
  }, [])

  // Función separada para cargar perfil
  const loadUserProfile = async (userId) => {
    try {
      logger.db('Loading profile for user', { userId })
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('Profile not found (404) - Table may not exist or no profile created')
        } else {
          logger.error('Error loading profile:', error)
        }
        setProfile(null)
      } else {
        logger.success('Profile loaded successfully')
        setProfile(data)
      }
    } catch (error) {
      logger.error('Exception loading profile:', error)
      setProfile(null)
    }
    
    logger.db('loadUserProfile completed')
  }

  // Registrar nuevo usuario
  const signUp = async (email, password, userData = {}) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.fullName || '',
            avatar_url: userData.avatarUrl || '',
            ...userData
          }
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      logger.error('Error in signUp:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Iniciar sesión
  const signIn = async (email, password) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      logger.error('Error in signIn:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Cerrar sesión
  const signOut = async () => {
    logger.auth('Starting signOut process')
    setLoading(true)
    
    try {
      setUser(null)
      setSession(null)
      setProfile(null)
      
      localStorage.clear()
      sessionStorage.clear()
      
      await supabase.auth.signOut()
      logger.success('SignOut completed successfully')
      
    } catch (error) {
      logger.error('Error in signOut:', error)
    } finally {
      setLoading(false)
    }
    
    return { error: null }
  }

  // Actualizar perfil de usuario
  const updateProfile = async (updates) => {
    if (!user) return { data: null, error: new Error('No hay usuario autenticado') }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      
      setProfile(data)
      return { data, error: null }
    } catch (error) {
      logger.error('Error updating profile:', error)
      return { data: null, error }
    }
  }

  // Subir avatar - versión simplificada
  const uploadAvatar = async (file) => {
    if (!user) {
      return { data: null, error: new Error('No hay usuario autenticado') }
    }
    
    try {
      logger.info('Uploading avatar', { fileName: file.name, size: file.size })
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)
      
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)
      
      const { error: updateError } = await updateProfile({
        avatar_url: publicUrl
      })
      
      if (updateError) throw updateError
      
      logger.success('Avatar uploaded successfully')
      return { data: publicUrl, error: null }
    } catch (error) {
      logger.error('Error uploading avatar:', error)
      return { data: null, error }
    }
  }

  // Eliminar avatar
  const deleteAvatar = async () => {
    if (!user || !profile?.avatar_url) return { error: null }
    
    try {
      const { error } = await updateProfile({ avatar_url: null })
      if (error) throw error
      return { error: null }
    } catch (error) {
      logger.error('Error deleting avatar:', error)
      return { error }
    }
  }

  // Eliminar cuenta
  const deleteAccount = async () => {
    if (!user) {
      return { error: new Error('No hay usuario autenticado') }
    }

    try {
      logger.warn('Starting account deletion process')
      
      // Primero eliminar el perfil de la base de datos
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (profileError) {
        logger.error('Error deleting profile:', profileError)
        // No retornamos aquí porque queremos intentar eliminar la cuenta de auth de todos modos
      }

      // Eliminar avatar del storage si existe
      if (profile?.avatar_url) {
        try {
          const fileName = profile.avatar_url.split('/').pop()
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${fileName}`])
        } catch (storageError) {
          logger.error('Error deleting avatar from storage:', storageError)
          // No es crítico, continuamos
        }
      }

      // Finalmente eliminar la cuenta de autenticación
      const { error: authError } = await supabase.rpc('delete_user')

      if (authError) {
        throw authError
      }

      // Limpiar estado local
      setUser(null)
      setSession(null)
      setProfile(null)
      
      localStorage.clear()
      sessionStorage.clear()

      logger.success('Account deleted successfully')
      return { error: null }
    } catch (error) {
      logger.error('Error deleting account:', error)
      return { error }
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    deleteAccount,
    isAuthenticated: !!user,
    loadUserProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext