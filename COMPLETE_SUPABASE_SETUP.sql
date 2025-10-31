-- ====================================================
-- SETUP COMPLETO DE SUPABASE - MALA JUNTA
-- Incluye: Perfiles, Personajes, Sistema de Media Social
-- ====================================================

-- ====================================================
-- 1. TABLA DE PERFILES DE USUARIO
-- ====================================================

-- Crear la tabla profiles (si no existe)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para profiles (si existen)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Crear políticas de seguridad para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ====================================================
-- 2. FUNCIONES Y TRIGGERS PARA PERFILES
-- ====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at cuando se modifica un perfil
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Función para crear automáticamente un perfil cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        COALESCE(new.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función cuando se crea un nuevo usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ====================================================
-- 3. TABLA DE PERSONAJES DE USUARIO
-- ====================================================

-- Tabla de personajes de usuario
CREATE TABLE IF NOT EXISTS public.characters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    subclass TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para la tabla characters
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para characters (si existen)
DROP POLICY IF EXISTS "Users can view own characters" ON public.characters;
DROP POLICY IF EXISTS "Users can insert own characters" ON public.characters;
DROP POLICY IF EXISTS "Users can update own characters" ON public.characters;
DROP POLICY IF EXISTS "Users can delete own characters" ON public.characters;

-- Políticas de seguridad para characters
CREATE POLICY "Users can view own characters" ON public.characters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own characters" ON public.characters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own characters" ON public.characters
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own characters" ON public.characters
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at en characters
DROP TRIGGER IF EXISTS on_character_updated ON public.characters;
CREATE TRIGGER on_character_updated
    BEFORE UPDATE ON public.characters
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ====================================================
-- 4. SISTEMA DE MEDIA SOCIAL - TABLAS
-- ====================================================

-- 4.1 TABLA PARA POSTS DE MEDIA
CREATE TABLE IF NOT EXISTS public.media_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.2 TABLA PARA LIKES DE POSTS
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.media_posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id) -- Un usuario solo puede dar like una vez por post
);

-- 4.3 TABLA PARA COMENTARIOS
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.media_posts(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.4 TABLA PARA LIKES DE COMENTARIOS
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, comment_id) -- Un usuario solo puede dar like una vez por comentario
);

-- 4.5 TABLA PARA ETIQUETAS DE PERSONAJES EN POSTS
CREATE TABLE IF NOT EXISTS public.post_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.media_posts(id) ON DELETE CASCADE NOT NULL,
    character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
    character_name TEXT NOT NULL, -- Nombre del personaje (para personajes no en DB)
    position_x FLOAT DEFAULT 0, -- Posición X del tag en la imagen (0-1)
    position_y FLOAT DEFAULT 0, -- Posición Y del tag en la imagen (0-1)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- 5. RLS PARA SISTEMA DE MEDIA SOCIAL
-- ====================================================

-- Habilitar RLS en todas las tablas de media
ALTER TABLE public.media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- 6. POLÍTICAS DE SEGURIDAD PARA MEDIA_POSTS
-- ====================================================

-- Eliminar políticas existentes (si existen)
DROP POLICY IF EXISTS "Anyone can view media posts" ON public.media_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.media_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.media_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.media_posts;

-- Todos pueden ver los posts
CREATE POLICY "Anyone can view media posts" ON public.media_posts
    FOR SELECT USING (true);

-- Solo usuarios autenticados pueden crear posts
CREATE POLICY "Authenticated users can create posts" ON public.media_posts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Solo el dueño puede actualizar sus posts
CREATE POLICY "Users can update own posts" ON public.media_posts
    FOR UPDATE USING (auth.uid() = user_id);

-- Solo el dueño puede eliminar sus posts
CREATE POLICY "Users can delete own posts" ON public.media_posts
    FOR DELETE USING (auth.uid() = user_id);

-- ====================================================
-- 7. POLÍTICAS DE SEGURIDAD PARA POST_LIKES
-- ====================================================

-- Eliminar políticas existentes (si existen)
DROP POLICY IF EXISTS "Anyone can view post likes" ON public.post_likes;
DROP POLICY IF EXISTS "Authenticated users can like posts" ON public.post_likes;
DROP POLICY IF EXISTS "Users can remove own likes" ON public.post_likes;

-- Todos pueden ver los likes
CREATE POLICY "Anyone can view post likes" ON public.post_likes
    FOR SELECT USING (true);

-- Solo usuarios autenticados pueden dar like
CREATE POLICY "Authenticated users can like posts" ON public.post_likes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Solo el dueño del like puede eliminarlo
CREATE POLICY "Users can remove own likes" ON public.post_likes
    FOR DELETE USING (auth.uid() = user_id);

-- ====================================================
-- 8. POLÍTICAS DE SEGURIDAD PARA COMMENTS
-- ====================================================

-- Eliminar políticas existentes (si existen)
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

-- Todos pueden ver los comentarios
CREATE POLICY "Anyone can view comments" ON public.comments
    FOR SELECT USING (true);

-- Solo usuarios autenticados pueden comentar
CREATE POLICY "Authenticated users can create comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Solo el dueño puede actualizar sus comentarios
CREATE POLICY "Users can update own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Solo el dueño puede eliminar sus comentarios
CREATE POLICY "Users can delete own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- ====================================================
-- 9. POLÍTICAS DE SEGURIDAD PARA COMMENT_LIKES
-- ====================================================

-- Eliminar políticas existentes (si existen)
DROP POLICY IF EXISTS "Anyone can view comment likes" ON public.comment_likes;
DROP POLICY IF EXISTS "Authenticated users can like comments" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can remove own comment likes" ON public.comment_likes;

-- Todos pueden ver los likes de comentarios
CREATE POLICY "Anyone can view comment likes" ON public.comment_likes
    FOR SELECT USING (true);

-- Solo usuarios autenticados pueden dar like a comentarios
CREATE POLICY "Authenticated users can like comments" ON public.comment_likes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Solo el dueño del like puede eliminarlo
CREATE POLICY "Users can remove own comment likes" ON public.comment_likes
    FOR DELETE USING (auth.uid() = user_id);

-- ====================================================
-- 10. POLÍTICAS DE SEGURIDAD PARA POST_TAGS
-- ====================================================

-- Eliminar políticas existentes (si existen)
DROP POLICY IF EXISTS "Anyone can view post tags" ON public.post_tags;
DROP POLICY IF EXISTS "Authenticated users can create post tags" ON public.post_tags;
DROP POLICY IF EXISTS "Users can manage tags on own posts" ON public.post_tags;

-- Todos pueden ver las etiquetas de posts
CREATE POLICY "Anyone can view post tags" ON public.post_tags
    FOR SELECT USING (true);

-- Solo usuarios autenticados pueden crear etiquetas
CREATE POLICY "Authenticated users can create post tags" ON public.post_tags
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM public.media_posts 
            WHERE id = post_id AND user_id = auth.uid()
        )
    );

-- Solo el dueño del post puede actualizar/eliminar etiquetas
CREATE POLICY "Users can manage tags on own posts" ON public.post_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.media_posts 
            WHERE id = post_id AND user_id = auth.uid()
        )
    );

-- ====================================================
-- 11. TRIGGERS PARA UPDATED_AT EN MEDIA SOCIAL
-- ====================================================

-- Trigger para actualizar updated_at en media_posts
DROP TRIGGER IF EXISTS on_media_post_updated ON public.media_posts;
CREATE TRIGGER on_media_post_updated
    BEFORE UPDATE ON public.media_posts
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger para actualizar updated_at en comments
DROP TRIGGER IF EXISTS on_comment_updated ON public.comments;
CREATE TRIGGER on_comment_updated
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ====================================================
-- 12. ÍNDICES PARA OPTIMIZAR PERFORMANCE
-- ====================================================

-- Índices para media_posts
CREATE INDEX IF NOT EXISTS idx_media_posts_user_id ON public.media_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_media_posts_created_at ON public.media_posts(created_at DESC);

-- Índices para post_likes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);

-- Índices para comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at ASC);

-- Índices para comment_likes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- Índices para post_tags
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON public.post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_character_id ON public.post_tags(character_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_character_name ON public.post_tags(character_name);

-- ====================================================
-- 13. VISTAS PARA SIMPLIFICAR CONSULTAS
-- ====================================================

-- Vista para obtener posts con información del usuario y contadores
DROP VIEW IF EXISTS public.media_posts_with_stats;
CREATE VIEW public.media_posts_with_stats AS
SELECT 
    mp.*,
    p.full_name as author_name,
    p.avatar_url as author_avatar,
    COALESCE(like_counts.like_count, 0) as like_count,
    COALESCE(comment_counts.comment_count, 0) as comment_count
FROM public.media_posts mp
LEFT JOIN public.profiles p ON mp.user_id = p.id
LEFT JOIN (
    SELECT post_id, COUNT(*) as like_count
    FROM public.post_likes
    GROUP BY post_id
) like_counts ON mp.id = like_counts.post_id
LEFT JOIN (
    SELECT post_id, COUNT(*) as comment_count
    FROM public.comments
    GROUP BY post_id
) comment_counts ON mp.id = comment_counts.post_id
ORDER BY mp.created_at DESC;

-- Vista para obtener comentarios con información del usuario y contadores de likes
DROP VIEW IF EXISTS public.comments_with_stats;
CREATE VIEW public.comments_with_stats AS
SELECT 
    c.*,
    p.full_name as author_name,
    p.avatar_url as author_avatar,
    COALESCE(like_counts.like_count, 0) as like_count
FROM public.comments c
LEFT JOIN public.profiles p ON c.user_id = p.id
LEFT JOIN (
    SELECT comment_id, COUNT(*) as like_count
    FROM public.comment_likes
    GROUP BY comment_id
) like_counts ON c.id = like_counts.comment_id
ORDER BY c.created_at ASC;

-- ====================================================
-- 14. CONFIGURACIÓN DE STORAGE PARA IMÁGENES
-- ====================================================

-- Crear bucket para imágenes de media posts (si no existe)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media-images', 'media-images', true)
ON CONFLICT (id) DO NOTHING;

-- Eliminar políticas existentes de storage (si existen)
DROP POLICY IF EXISTS "Authenticated users can upload media images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view media images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own media images" ON storage.objects;

-- Política para subir imágenes (solo usuarios autenticados)
CREATE POLICY "Authenticated users can upload media images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'media-images' 
    AND auth.uid() IS NOT NULL
);

-- Política para ver imágenes (público)
CREATE POLICY "Anyone can view media images"
ON storage.objects FOR SELECT
USING (bucket_id = 'media-images');

-- Política para eliminar imágenes (solo el dueño)
CREATE POLICY "Users can delete own media images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'media-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ====================================================
-- 15. FUNCIÓN PARA ELIMINAR USUARIO COMPLETO
-- ====================================================

-- Función RPC para eliminar usuario (debe ser ejecutada por el propio usuario)
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Obtener el ID del usuario autenticado
    user_id := auth.uid();
    
    -- Verificar que hay un usuario autenticado
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'No authenticated user found';
    END IF;
    
    -- Eliminar los likes de comentarios del usuario
    DELETE FROM public.comment_likes WHERE user_id = user_id;
    
    -- Eliminar los comentarios del usuario
    DELETE FROM public.comments WHERE user_id = user_id;
    
    -- Eliminar los likes de posts del usuario
    DELETE FROM public.post_likes WHERE user_id = user_id;
    
    -- Eliminar los posts de media del usuario
    DELETE FROM public.media_posts WHERE user_id = user_id;
    
    -- Eliminar los personajes del usuario
    DELETE FROM public.characters WHERE user_id = user_id;
    
    -- Eliminar el perfil del usuario (esto se hace automáticamente por CASCADE)
    -- pero lo hacemos explícitamente por claridad
    DELETE FROM public.profiles WHERE id = user_id;
    
    -- Eliminar el usuario de auth.users
    -- Nota: En Supabase, esto puede requerir permisos especiales
    -- o configuración adicional dependiendo de tu setup
    DELETE FROM auth.users WHERE id = user_id;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================
-- 🎉 SETUP COMPLETO FINALIZADO
-- ====================================================
-- Este script incluye:
-- ✅ Sistema de perfiles de usuario
-- ✅ Sistema de personajes
-- ✅ Sistema completo de media social (posts, likes, comentarios)
-- ✅ Todas las políticas de seguridad RLS
-- ✅ Índices para optimización
-- ✅ Vistas para consultas complejas
-- ✅ Storage para imágenes
-- ✅ Función para eliminar usuario completo
-- ====================================================