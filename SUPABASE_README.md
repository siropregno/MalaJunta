# 🚀 MalaJunta - Configuración de Supabase

¡Tu proyecto MalaJunta ya está configurado con autenticación completa usando Supabase! 🎉

## 📋 ¿Qué se ha configurado?

### ✅ Sistema completo de autenticación:
- **Registro de usuarios** con validación
- **Inicio de sesión** seguro
- **Gestión de perfiles** de usuario
- **Cierre de sesión**
- **Integración con navbar** responsive

### ✅ Componentes creados:
- `AuthContext` - Manejo global del estado de autenticación
- `Login` - Formulario de inicio de sesión
- `Register` - Formulario de registro
- `Profile` - Gestión de perfil de usuario
- `AuthModal` - Modal para login/register
- `Navbar` actualizado con opciones de autenticación

### ✅ Hooks personalizados:
- `useAuthContext` - Para acceder al contexto de autenticación
- `useSupabase` - Para operaciones con la base de datos

## 🛠️ Configuración paso a paso

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Espera a que se complete la configuración

### 2. Configurar la base de datos

1. Ve a **SQL Editor** en tu dashboard de Supabase
2. Copia y pega el contenido del archivo `supabase-setup.sql`
3. Ejecuta el SQL para crear:
   - Tabla `profiles`
   - Políticas de seguridad (RLS)
   - Triggers automáticos

### 3. Configurar variables de entorno

1. Ve a **Settings > API** en tu proyecto de Supabase
2. Copia tu **Project URL** y **anon key**
3. Edita el archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
```

### 4. Configurar autenticación

1. Ve a **Authentication > Settings** en Supabase
2. Configura las opciones según tus necesidades:
   - **Site URL**: `http://localhost:5173` (para desarrollo)
   - **Redirect URLs**: Añade las URLs de tu aplicación
   - Habilita los proveedores que desees (Email, Google, GitHub, etc.)

### 5. Ejecutar la aplicación

```bash
npm run dev
```

## 🎯 Características principales

### 🔐 Autenticación segura
- Validación de formularios
- Manejo de errores
- Estados de carga
- Persistencia de sesión

### 📱 Responsive design
- Funciona en desktop y móvil
- Navbar adaptativo
- Modales responsive

### 🎨 UI moderna
- Efectos de glassmorphism
- Animaciones suaves
- Dark/Light mode automático
- Estilos consistentes

### ⚡ Performance optimizada
- Hooks eficientes
- Estados locales bien gestionados
- Componentes reutilizables

## 🚀 Próximos pasos

### Opcional - Configuraciones adicionales:

1. **Email templates**: Personaliza los emails en Authentication > Email Templates
2. **Social providers**: Configura Google, GitHub, etc. en Authentication > Providers
3. **Custom domains**: Configura tu dominio personalizado
4. **Database backup**: Configura backups automáticos

### Extensiones recomendadas:

1. **Perfiles extendidos**: Añade más campos (bio, teléfono, etc.)
2. **Upload de avatares**: Integra storage para imágenes
3. **Roles de usuario**: Sistema de permisos
4. **Reset password**: Funcionalidad completa de recuperación

## 📁 Estructura de archivos creados

```
src/
├── lib/
│   └── supabase.js          # Configuración de Supabase
├── hooks/
│   ├── useSupabase.js       # Hook para operaciones DB
│   └── useAuthContext.js    # Hook para contexto auth
├── contexts/
│   └── AuthContext.jsx      # Contexto de autenticación
└── Components/
    ├── Auth/
    │   ├── Login.jsx        # Componente de login
    │   ├── Register.jsx     # Componente de registro
    │   ├── Profile.jsx      # Componente de perfil
    │   ├── AuthModal.jsx    # Modal de autenticación
    │   └── Auth.css         # Estilos de auth
    └── Navbar/
        ├── navbar.jsx       # Navbar actualizado
        └── navbar.css       # Estilos del navbar
```

## 🐛 Troubleshooting

### Error: Variables de entorno no encontradas
- Verifica que el archivo `.env` está en la raíz del proyecto
- Las variables deben empezar con `VITE_`
- Reinicia el servidor de desarrollo

### Error: RLS policies
- Asegúrate de ejecutar el SQL de configuración
- Verifica que las políticas están habilitadas
- Revisa los logs en Supabase dashboard

### Error: CORS
- Configura las URLs correctas en Authentication > Settings
- Añade `http://localhost:5173` para desarrollo

## 📞 Soporte

Si tienes problemas:
1. Revisa la [documentación de Supabase](https://supabase.com/docs)
2. Verifica la consola del navegador para errores
3. Revisa los logs en tu dashboard de Supabase

¡Tu aplicación MalaJunta está lista para usar! 🎉