-- Tabla de perfiles de usuario
-- Esta tabla se debe crear en Supabase SQL Editor

-- Crear la tabla profiles
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

-- Crear políticas de seguridad
-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Los usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

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

-- Políticas de seguridad para characters
-- Los usuarios pueden ver sus propios personajes
CREATE POLICY "Users can view own characters" ON public.characters
    FOR SELECT USING (auth.uid() = user_id);

-- Los usuarios pueden insertar sus propios personajes
CREATE POLICY "Users can insert own characters" ON public.characters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propios personajes
CREATE POLICY "Users can update own characters" ON public.characters
    FOR UPDATE USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propios personajes
CREATE POLICY "Users can delete own characters" ON public.characters
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at en characters
DROP TRIGGER IF EXISTS on_character_updated ON public.characters;
CREATE TRIGGER on_character_updated
    BEFORE UPDATE ON public.characters
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

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