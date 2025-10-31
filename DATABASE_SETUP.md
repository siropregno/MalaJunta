# Verificación de la tabla profiles en Supabase

## Pasos para verificar y configurar la tabla profiles:

### 1. Verificar si la tabla existe:
Ejecuta esta consulta en el SQL Editor de Supabase:

```sql
SELECT * FROM information_schema.tables WHERE table_name = 'profiles';
```

### 2. Si la tabla NO existe, créala:

```sql
-- Crear tabla profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Política para que los usuarios puedan actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política para que los usuarios puedan insertar su propio perfil
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 3. Verificar las políticas RLS:

```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### 4. Crear función trigger para actualizar updated_at:

```sql
-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en cada UPDATE
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
```

### 5. Insertar perfil de prueba (opcional):
```sql
-- Solo para testing - reemplaza con tu user ID real
INSERT INTO profiles (id, email, full_name)
VALUES (
  auth.uid(), -- Esto solo funciona si estás autenticado
  'tu@email.com',
  'Tu Nombre'
);
```

### 6. Verificar datos:
```sql
SELECT * FROM profiles WHERE id = auth.uid();
```

## Estructura final de la tabla:
```
profiles
├── id (UUID, PK, FK a auth.users)
├── email (TEXT)
├── full_name (TEXT) 
├── avatar_url (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```