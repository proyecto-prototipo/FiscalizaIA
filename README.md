# FiscalizaIA Minera — PMV de dos roles

Versión reestructurada del PMV con:

1. **Administrador Fiscalizador**
2. **Empresa Evaluada**

El diseño del login se conserva según el código y CSS entregados. Solo se actualizaron las opciones del selector para los dos roles nuevos.

## Alcance implementado

### Administrador Fiscalizador

- Dashboard global.
- Empresas.
- Operaciones.
- Obligaciones y asignaciones.
- Revisión de evidencias.
- Revisión de análisis IA.
- Evaluaciones y validación humana.
- Brechas y riesgos.
- Observaciones.
- Recomendaciones.
- Resultados.
- Reportes.
- Configuración.

### Empresa Evaluada

- Resumen de cumplimiento.
- Mi operación.
- Obligaciones asignadas.
- Carga y reemplazo de evidencias.
- Estado de revisión.
- Observaciones.
- Recomendaciones.
- Brechas y riesgos.
- Resultado.

Cada rol tiene sus propias carpetas, páginas, servicios y estilos. Ambos se conectan mediante las mismas tablas de Supabase y reciben cambios con Realtime.

## Ejecutar en modo demostración

```bash
npm install
cp .env.example .env
npm run dev
```

El archivo `.env.example` tiene:

```env
VITE_DEMO_MODE=true
```

En este modo se puede navegar sin Supabase.

### Credenciales demostrativas

No se valida la contraseña mientras `VITE_DEMO_MODE=true`.

- Administrador Fiscalizador: selecciona `Administrador Fiscalizador`.
- Empresa Evaluada: selecciona `Empresa Evaluada`.

## Conectar Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta en orden:

```text
supabase/migrations/001_pmv_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_dashboard_function.sql
supabase/seed/demo.sql
```

3. Crea `.env`:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
VITE_DEMO_MODE=false
```

4. Crea usuarios desde Supabase Auth.
5. Inserta sus perfiles en `public.profiles` con uno de estos roles:

```text
fiscalizador
empresa_evaluada
```

La Empresa Evaluada debe tener `company_id`.

## Google AI Studio

Configura secretos:

```bash
supabase secrets set GOOGLE_AI_API_KEY=TU_API_KEY
supabase secrets set GOOGLE_AI_MODEL=gemini-2.0-flash
```

Despliega:

```bash
supabase functions deploy analyze-evidence
```

La API key no se expone en React. Se utiliza desde la Edge Function.

## Realtime

El esquema agrega a `supabase_realtime` las tablas principales. Los dashboards y módulos escuchan cambios de:

- companies
- mining_operations
- obligation_assignments
- evidence_documents
- ai_analyses
- evaluations
- gaps
- observations
- recommendations
- preparation_scores

## Importante

Esta entrega es una base funcional, estructurada y conectable. Las operaciones reales requieren:

- credenciales Supabase;
- usuarios Auth;
- perfiles;
- datos reales;
- despliegue de la Edge Function;
- API key de Google AI Studio.

FiscalizaIA Minera es una herramienta preventiva de organización, análisis y preparación interna. No constituye certificación oficial, auditoría formal, opinión legal ni garantía de cumplimiento.
