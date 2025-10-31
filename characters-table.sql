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