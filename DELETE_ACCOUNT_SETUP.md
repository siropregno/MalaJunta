# Configuración para Eliminar Cuentas

## Instrucciones para Supabase

Para habilitar la funcionalidad de eliminar cuentas, necesitas ejecutar la función RPC en tu base de datos de Supabase.

### Paso 1: Ejecutar la función SQL

1. Ve a tu proyecto de Supabase
2. Navega a **SQL Editor**
3. Ejecuta el siguiente código SQL:

```sql
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
    
    -- Eliminar el perfil del usuario (esto se hace automáticamente por CASCADE)
    -- pero lo hacemos explícitamente por claridad
    DELETE FROM public.profiles WHERE id = user_id;
    
    -- Eliminar el usuario de auth.users
    -- Nota: En Supabase, esto puede requerir permisos especiales
    -- o configuración adicional dependiendo de tu setup
    DELETE FROM auth.users WHERE id = user_id;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Paso 2: Configurar Storage (Opcional)

Si quieres que se eliminen automáticamente los avatares del storage cuando se elimina un usuario:

1. Ve a **Storage** > **avatars** (o el bucket que uses para avatares)
2. En **Policies**, crea una nueva política para DELETE:
   - Name: `Users can delete own avatar`
   - Policy: `auth.uid()::text = (storage.foldername(name))[1]`

### Paso 3: Verificar Permisos

En algunos casos, Supabase puede requerir configuración adicional para permitir que los usuarios eliminen sus propias cuentas de la tabla `auth.users`. Si encuentras errores de permisos:

1. Ve a **Authentication** > **Settings**
2. Verifica que esté habilitada la opción para eliminar usuarios
3. O contacta al soporte de Supabase para habilitar esta funcionalidad

### Funcionalidad Implementada

La nueva funcionalidad incluye:

- **Danger Zone** en el perfil del usuario
- Confirmación doble para eliminar cuenta
- Eliminación de:
  - Perfil de usuario
  - Avatar (si existe)
  - Cuenta de autenticación
- Limpieza del estado local
- Redireccionamiento al home

### Proceso de Eliminación

1. El usuario hace clic en "Eliminar cuenta"
2. Se le pide escribir "ELIMINAR" para confirmar
3. Se muestra una confirmación final
4. Se ejecuta la eliminación:
   - Se borra el perfil de la base de datos
   - Se intenta eliminar el avatar del storage
   - Se elimina la cuenta de autenticación
5. Se limpia el estado local
6. Se redirige al usuario al home

### Seguridad

- Solo el usuario autenticado puede eliminar su propia cuenta
- Se requiere confirmación doble
- La función RPC verifica la autenticación antes de proceder
- Se limpia completamente el estado local después de la eliminación