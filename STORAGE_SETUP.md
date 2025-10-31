# Configuración de Storage para Avatares en Supabase

## Instrucciones para configurar el bucket de avatares:

### 1. Crear el bucket en Supabase Dashboard:
1. Ve a tu proyecto en https://supabase.com/dashboard
2. Navega a Storage > Buckets
3. Haz clic en "New bucket"
4. Nombre: `avatars`
5. Public: ✅ (marcado)
6. Allowed MIME types: `image/*`
7. Max file size: `5MB`

### 2. Configurar políticas RLS (Row Level Security):

Ejecuta estas consultas SQL en el SQL Editor de Supabase:

```sql
-- Política para permitir que los usuarios suban sus propios avatares
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir que los usuarios actualicen sus propios avatares
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir que los usuarios eliminen sus propios avatares
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir lectura pública de avatares
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

### 3. Verificar configuración:
- El bucket debe aparecer como público
- Las políticas deben estar activas
- Los usuarios autenticados pueden subir archivos a su carpeta (`user_id/`)

### 4. Estructura de archivos:
```
avatars/
├── user_id_1/
│   └── avatar-timestamp.jpg
├── user_id_2/
│   └── avatar-timestamp.png
└── ...
```

### 5. Formato de URL pública:
```
https://[PROJECT_REF].supabase.co/storage/v1/object/public/avatars/[user_id]/avatar-[timestamp].[ext]
```

## Notas importantes:
- Los archivos se organizan por carpetas de usuario (user_id)
- Solo el propietario puede subir/modificar/eliminar sus avatares
- Todos pueden ver los avatares (lectura pública)
- Tamaño máximo: 5MB por imagen
- Formatos soportados: JPG, PNG, GIF, WebP