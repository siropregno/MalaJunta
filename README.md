# MalaJunta - Plataforma Social para Gamers

Una plataforma social moderna construida con React + Vite + Supabase, diseñada para la comunidad gamer.

## 🚀 Características

- **Sistema de Autenticación** - Login/Registro con Supabase Auth
- **Perfiles de Usuario** - Gestión completa de perfiles con avatares
- **Sistema de Personajes** - Crear y gestionar personajes de juego
- **Media Social** - Subir fotos, dar likes y comentar como Instagram
- **Sistema de Comentarios** - Comentarios anidados con likes
- **Storage de Imágenes** - Subida y gestión de imágenes con Supabase Storage
- **Responsive Design** - Diseño adaptativo para móviles y desktop

## 🛠️ Tecnologías

- **Frontend**: React 18, Vite, CSS3
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Icons**: FontAwesome
- **Deployment**: Vercel/Netlify compatible

## 📋 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd MalaJunta
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Supabase**
   - Crear proyecto en [Supabase](https://supabase.com)
   - Copiar URL y ANON KEY del proyecto
   - Crear archivo `.env.local`:
     ```
     VITE_SUPABASE_URL=tu_supabase_url
     VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
     ```

4. **Configurar la base de datos**
   - Abrir el SQL Editor en tu dashboard de Supabase
   - Ejecutar el script completo `COMPLETE_SUPABASE_SETUP.sql`
   - Esto creará todas las tablas, políticas RLS, índices y configuración de storage

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

## 📁 Estructura del Proyecto

```
src/
├── Components/
│   ├── Chars/           # Gestión de personajes
│   ├── Info/            # Perfil de usuario
│   ├── Navbar/          # Navegación
│   ├── Options/         # Configuraciones
│   ├── MediaPost/       # Posts individuales
│   └── CommentItem/     # Componentes de comentarios
├── contexts/
│   └── AuthContext.jsx  # Context de autenticación
├── hooks/
│   ├── useAuthContext.js
│   └── useSupabase.js
├── lib/
│   ├── supabase.js      # Cliente de Supabase
│   └── database.js      # Funciones de base de datos
├── pages/
│   ├── Home/
│   ├── Login/
│   ├── Profile/
│   └── Media/           # Feed social
└── utils/
    └── logger.js        # Sistema de logging
```

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build para producción
- `npm run preview` - Preview del build
- `npm run lint` - Linting con ESLint

## 🗄️ Base de Datos

El proyecto utiliza las siguientes tablas principales:

- **profiles** - Perfiles de usuario
- **characters** - Personajes de juego
- **media_posts** - Posts con imágenes
- **comments** - Comentarios en posts
- **post_likes** - Likes en posts
- **comment_likes** - Likes en comentarios

## 🔒 Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Políticas de seguridad granulares
- Autenticación JWT con Supabase
- Storage con políticas de acceso controlado

## 🎯 Uso

1. **Registro/Login** - Crear cuenta o iniciar sesión
2. **Configurar Perfil** - Subir avatar y completar información
3. **Crear Personajes** - Añadir personajes de juego
4. **Subir Media** - Compartir imágenes en el feed social
5. **Interactuar** - Dar likes y comentar en posts

## 🚀 Deployment

Para deployar en Vercel/Netlify:

1. Conectar el repositorio
2. Configurar las variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automático

## 🤝 Contribuir

1. Fork del proyecto
2. Crear branch para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.
