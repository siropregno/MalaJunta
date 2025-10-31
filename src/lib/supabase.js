import { createClient } from '@supabase/supabase-js'

// Variables de entorno de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Verificar que las variables de entorno están configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno de Supabase. ' +
    'Por favor configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env'
  )
}

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'implicit'
  }
})

// Funciones helper para autenticación
export const auth = {
  // Registrar nuevo usuario
  signUp: async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  },

  // Iniciar sesión
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Cerrar sesión
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Obtener usuario actual
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Obtener sesión actual
  getCurrentSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Restablecer contraseña
  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    return { data, error }
  }
}

// Funciones helper para base de datos
export const database = {
  // Obtener perfil de usuario
  getUserProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  // Actualizar perfil de usuario
  updateUserProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  },

  // Crear perfil de usuario
  createUserProfile: async (profile) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert([profile])
      .select()
      .single()
    return { data, error }
  }
}

// Funciones helper para storage
export const storage = {
  // Subir avatar
  uploadAvatar: async (userId, file) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`
    
    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) return { data: null, error }
    
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)
    
    return { data: { path: fileName, url: publicUrl }, error: null }
  },

  // Eliminar avatar
  deleteAvatar: async (filePath) => {
    const { data, error } = await supabase.storage
      .from('avatars')
      .remove([filePath])
    return { data, error }
  },

  // Obtener URL pública del avatar
  getAvatarUrl: (filePath) => {
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)
    return publicUrl
  }
}

export default supabase