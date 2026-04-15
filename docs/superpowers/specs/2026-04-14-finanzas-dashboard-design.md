# Dashboard de Finanzas Personales — Diseño

**Fecha**: 2026-04-14
**Autor**: Jaime (con asistencia de Claude)
**Estado**: Borrador para revisión

## 1. Resumen

Aplicación web de finanzas personales para usuarios regulares que quieren una imagen clara de sus gastos, suscripciones, compras a meses sin intereses (MSI), inversiones y hábitos de gasto. El foco principal es el manejo de compras MSI con proyección de pagos mensuales a 12-24 meses, y la visualización clara del gasto del mes contra una meta suave.

La app está pensada inicialmente para uso personal del autor y un grupo reducido de familia/amigos. Cada usuario tiene sus propios datos aislados. Todas las transacciones se capturan manualmente. Moneda única MXN.

Una versión móvil podrá construirse más adelante reutilizando la API; no es parte de este alcance.

## 2. Objetivos

1. Responder de un vistazo: "¿cuánto he gastado este mes y cómo voy respecto a mi meta?"
2. Responder de un vistazo: "¿cuánto voy a pagar en MSI este mes y los siguientes?"
3. Permitir explorar el detalle de cada compra MSI y su calendario de pagos.
4. Monitorear suscripciones activas, su próximo cobro y el gasto anual proyectado.
5. Registrar el saldo manual de inversiones (fondos, PPR) para ver patrimonio total.
6. Detectar hábitos de gasto (tendencias, comparativas, gastos hormiga) sin imponer presupuestos rígidos.

## 3. No-objetivos

- **Sin integración bancaria automática** (Belvo/Plaid). Captura 100% manual.
- **Sin multi-moneda**. Solo MXN.
- **Sin cuentas compartidas / finanzas en pareja** en el MVP. Cada cuenta es aislada.
- **Sin importación de CSV** en el MVP (puede agregarse después).
- **Sin app móvil nativa** en este alcance. La app web debe funcionar razonablemente en mobile browser como fallback, pero no es el enfoque.
- **Sin presupuestos estrictos con alertas**. Solo una meta suave mensual como referencia.
- **Sin precios en tiempo real de inversiones**. Saldo manual únicamente.
- **Sin recordatorios/notificaciones por email o push** en el MVP.

## 4. Stack técnico

- **Framework**: Next.js 14 con App Router
- **Lenguaje**: TypeScript en estricto
- **Estilos**: Tailwind CSS + shadcn/ui para componentes base
- **Gráficas**: Recharts
- **Backend**: Server Actions y Route Handlers de Next.js (sin servidor separado)
- **Base de datos**: Supabase Postgres
- **Autenticación**: Supabase Auth (email + magic link como mínimo; Google opcional)
- **Seguridad de datos**: Row Level Security (RLS) en todas las tablas — cada usuario solo ve sus propios datos
- **Hosting**: Vercel para la app, Supabase para DB/Auth
- **Formularios**: React Hook Form + Zod para validación
- **Manejo de fechas**: date-fns con timezone México (America/Mexico_City)
- **Tema**: claro y oscuro (toggle persistido en la preferencia del usuario)

Se eligió Supabase por su combinación de Postgres gestionado + Auth listo + RLS, lo que permite llegar rápido a un producto multi-usuario real sin escribir un backend desde cero. Los datos permanecen portables (Postgres estándar).

## 5. Estética

Profesional y serio, estilo banca digital (referencias mentales: Mercury, Ramp, Revolut web). Paleta base monocromática con un acento para datos críticos. Tipografía limpia, tablas densas, tarjetas con bordes sutiles. Sin emojis en UI de producción, sin microinteracciones juguetonas. Tema oscuro por defecto si el sistema del usuario está en oscuro.

## 6. Arquitectura de información

La app se divide en 8 secciones accesibles desde un sidebar fijo a la izquierda, agrupadas así:

**Principal**
1. **Dashboard** — vista general
2. **Transacciones** — CRUD y búsqueda de ingresos/gastos

**Compromisos**
3. **MSI** — compras a meses sin intereses y sus proyecciones
4. **Suscripciones** — servicios recurrentes

**Patrimonio**
5. **Inversiones** — fondos y PPR con saldo manual
6. **Cuentas y tarjetas** — tarjetas y cuentas de débito/crédito/efectivo

**Análisis**
7. **Reportes** — tendencias, comparativas, hábitos
8. **Ajustes** — perfil, categorías, tema, meta mensual

## 7. Modelo de datos

Todas las tablas incluyen `user_id uuid references auth.users` con RLS activada, además de `created_at` y `updated_at`.

### `accounts`
Cuentas bancarias, tarjetas y efectivo del usuario.
- `id`, `user_id`
- `name` (ej: "BBVA Oro")
- `type` enum: `debit`, `credit`, `cash`
- `bank` (opcional, texto libre)
- `last_four` (opcional, 4 dígitos)
- `closing_day` (día de corte, solo tarjetas de crédito, 1-31)
- `payment_day` (día límite de pago, 1-31)
- `current_balance` numeric(12,2)
- `is_active` boolean

### `categories`
Categorías de gasto e ingreso. Se crean defaults al crear usuario (ver Sección 10).
- `id`, `user_id`
- `name`
- `kind` enum: `expense`, `income`
- `color` (hex, para gráficas)
- `icon` (nombre de lucide icon)
- `is_default` boolean (para no permitir borrar las que vienen precargadas)

### `transactions`
Movimientos individuales capturados manualmente.
- `id`, `user_id`
- `date` date
- `amount` numeric(12,2) (siempre positivo)
- `kind` enum: `expense`, `income`
- `category_id` references `categories`
- `account_id` references `accounts` (nullable — ver nota)
- `description` text
- `notes` text (opcional)
- `source` enum: `manual`, `msi_aggregate` (ver Sección 8 para `msi_aggregate`)

> `account_id` es nullable únicamente para transacciones con `source = msi_aggregate`, que representan pagos de múltiples compras en posiblemente distintas cuentas. Para `source = manual`, `account_id` es obligatorio (validado server-side).
- `msi_aggregate_month` date (nullable, primer día del mes si `source = msi_aggregate`, sirve para no duplicar)

### `msi_purchases`
Compras a meses sin intereses. Los pagos individuales **no se guardan** en esta tabla; se calculan en vuelo.
- `id`, `user_id`
- `description` text (ej: "Laptop Dell")
- `merchant` text (ej: "Amazon")
- `total_amount` numeric(12,2)
- `installments` int (3, 6, 12, 18, 24, etc.)
- `purchase_date` date
- `first_payment_month` date (primer día del mes del primer pago; normalmente el mes siguiente al corte)
- `account_id` references `accounts`
- `category_id` references `categories`
- `status` enum: `active`, `completed`, `cancelled`

**Derivados calculados** (no almacenados):
- `monthly_amount = total_amount / installments`
- `payments_remaining`, `months_remaining`, `last_payment_month`
- `amount_due_in_month(month)` — suma a pagar en un mes dado

### `subscriptions`
Servicios recurrentes.
- `id`, `user_id`
- `name` (ej: "Netflix")
- `amount` numeric(12,2)
- `frequency` enum: `monthly`, `annual`
- `next_charge_date` date
- `account_id` references `accounts`
- `category_id` references `categories`
- `status` enum: `active`, `cancelled`
- `started_at` date (opcional)

### `investments`
Inversiones con saldo manual.
- `id`, `user_id`
- `name` (ej: "GBM+ Fondo Agresivo")
- `type` enum: `mutual_fund`, `ppr`
- `current_balance` numeric(14,2)
- `last_updated_at` timestamp (cuándo fue la última actualización manual)

### `monthly_goals`
Meta suave de gasto mensual. Un registro por mes por usuario.
- `id`, `user_id`
- `month` date (primer día del mes)
- `target_amount` numeric(12,2)

### `user_settings`
- `user_id` (PK)
- `theme` enum: `light`, `dark`, `system`
- `default_monthly_goal` numeric(12,2) (se usa al generar `monthly_goals` automáticamente si no existe)

## 8. Manejo de pagos MSI (decisión clave)

**Modelo**: Los pagos mensuales de MSI **no viven en `msi_purchases`** ni se guardan individualmente por compra. En cambio, **al primer acceso del usuario a la app en un nuevo mes**, el sistema:

1. Revisa si ya existe una transacción con `source = msi_aggregate` y `msi_aggregate_month = mes actual`.
2. Si no existe, calcula la suma total de pagos MSI para el mes actual sobre todas las compras activas.
3. Crea una única transacción agregada:
   - `date`: primer día del mes
   - `amount`: suma calculada
   - `kind`: `expense`
   - `category_id`: categoría especial "MSI" (default)
   - `account_id`: null (representa múltiples cuentas; el detalle por cuenta vive en la sección MSI)
   - `description`: "Pagos MSI de [mes]"
   - `source`: `msi_aggregate`
   - `msi_aggregate_month`: primer día del mes

De esta forma:
- El dashboard "gasto del mes por categoría" naturalmente incluye MSI sin lógica especial.
- La sección MSI sigue siendo la fuente de verdad del detalle por compra.
- No hay duplicación ni desincronización.
- Si el usuario edita una compra MSI después de que ya se generó el agregado del mes, se recalcula el monto del agregado existente (no se crea uno nuevo).
- Los meses futuros NO tienen transacción agregada todavía — su proyección se calcula en vuelo al renderizar la timeline.

**Ubicación de la lógica**: Un Server Action `ensureCurrentMonthMsiAggregate(userId)` que se llama al entrar al Dashboard y a Transacciones. Idempotente.

**Por qué no un cron job**: Un cron agregaría complejidad operativa (edge functions, scheduled triggers). El enfoque "lazy, al primer acceso" funciona igual y es más simple de razonar. Trade-off: si el usuario no abre la app en un mes, el agregado no existe hasta que entre — aceptable porque igual no está viendo nada ese mes.

## 9. Páginas — contenido y funcionalidad

### 9.1 Dashboard

Coincide con el mockup aprobado. Contiene, de arriba a abajo:

1. **Fila de 4 KPIs**:
   - Balance del mes (ingresos − gastos, con % vs. mes anterior)
   - Gastado del mes + barra de progreso hacia la meta
   - MSI del mes (monto total del agregado)
   - Suscripciones del mes: suma de suscripciones mensuales activas + prorrateo de anuales (`amount / 12`) para mostrar el costo mensualizado equivalente

2. **Fila de 2 tarjetas**:
   - Gasto por categoría (dona + leyenda con top 5)
   - Tendencia de 6 meses (sparkline de gasto total con promedio)

3. **Proyección MSI próximos 12 meses** (fila completa):
   - Barras por mes con el total a pagar
   - Leyenda textual: "El pago más alto es en [mes]. [Producto] termina en [mes]."

Todos los números son clickeables y llevan a la sección correspondiente con el filtro pre-aplicado.

### 9.2 Transacciones

- Tabla con columnas: fecha, descripción, categoría, cuenta, monto, tipo
- Filtros: rango de fechas, categoría, cuenta, tipo (gasto/ingreso), búsqueda por texto
- Paginación
- Botón "Nueva transacción" → modal con form validado (React Hook Form + Zod)
- Editar/borrar inline
- Las transacciones con `source = msi_aggregate` se muestran con un badge "MSI" y son de solo lectura (no se editan directamente; se edita la compra MSI correspondiente)

### 9.3 MSI

- **Vista principal**: tabla de compras MSI activas con columnas: descripción, comercio, monto total, mensualidad, progreso (X/Y), mes en que termina, botón "detalle"
- **Tabs**: Activas · Terminadas · Canceladas
- **Botón "Nueva compra MSI"** → form con todos los campos de `msi_purchases`
- **Detalle de compra**: modal o página con el calendario completo de pagos (mes a mes), monto acumulado pagado, monto restante
- **Simulador**: widget "¿Y si compro esto?" donde el usuario mete monto y plazos y ve cómo queda la proyección de los siguientes 12 meses con y sin esa compra
- **Gráfica de proyección a 24 meses**: barras apiladas donde cada color es una compra diferente, para ver qué contribuye a cada mes

### 9.4 Suscripciones

- Tabla: nombre, monto, frecuencia, próximo cobro, cuenta, estado
- Filtros: activas/canceladas, frecuencia
- Botón "Nueva suscripción"
- Widget de resumen arriba: total mensual recurrente, total anual proyectado (mensuales × 12 + anuales)
- Sort por "próximas a cobrar" para ver qué viene

### 9.5 Inversiones

- Lista simple de inversiones con saldo actual y fecha de última actualización
- Botón "Actualizar saldo" por inversión → input simple de monto nuevo
- KPI arriba: patrimonio total invertido, cambio desde el inicio (suma de aportaciones manuales vs. saldo actual si se decide trackear — opcional)
- Tipos soportados: `mutual_fund`, `ppr`

### 9.6 Cuentas y tarjetas

- CRUD de cuentas
- Vista tipo tarjeta para cada cuenta con su saldo, tipo, día de corte/pago si aplica
- Suma total de saldos positivos y deuda en tarjetas de crédito

### 9.7 Reportes

- **Tendencias por categoría**: gráfica de líneas mostrando el gasto mensual en las top categorías durante los últimos 6 meses
- **Comparativa mes vs. mes**: lado a lado con delta por categoría
- **Gastos hormiga**: tabla de categorías donde el conteo de transacciones es alto y el monto promedio bajo (ej: "Cafés: 23 transacciones, promedio $85, total $1,955")
- **Promedio histórico**: cuánto gastas en promedio por categoría y este mes vs. promedio

### 9.8 Ajustes

- Perfil: nombre, email (readonly, gestionado por Supabase Auth)
- Preferencia de tema (claro/oscuro/sistema)
- Meta mensual default (se usa para pre-llenar al generar un nuevo mes)
- Categorías personalizadas (CRUD; las default no son borrables pero sí renombrables)

## 10. Flujos clave

### Alta de usuario nuevo
1. Usuario se registra con email/magic link vía Supabase Auth
2. Trigger (Postgres function) crea: `user_settings` con defaults, categorías default (Comida, Transporte, Entretenimiento, Salud, Hogar, Ropa, MSI, Suscripciones, Otros, y las de ingreso: Salario, Freelance, Otros), una `account` default "Efectivo", y un `monthly_goal` para el mes actual con un valor inicial sugerido (ej: 20,000 MXN).

### Alta de compra MSI
1. Usuario llena form con los datos
2. Al guardar, si `first_payment_month` es el mes actual o anterior y ya existe un `msi_aggregate` para este mes, se recalcula ese agregado para incluir la nueva compra
3. Redirect a la lista de MSI con la nueva compra resaltada

### Entrada al dashboard (primer acceso del mes)
1. Server Action `ensureCurrentMonthMsiAggregate()` corre
2. Genera la transacción agregada MSI si falta
3. Si no existe `monthly_goals` para el mes actual, se crea con el valor de `user_settings.default_monthly_goal`
4. Se renderiza el dashboard con los datos frescos

## 11. Seguridad

- **Row Level Security (RLS)** activa en todas las tablas con política `user_id = auth.uid()` para SELECT, INSERT, UPDATE y DELETE
- **Validación server-side**: todos los Server Actions revalidan los datos con Zod antes de tocar la DB, sin confiar en el cliente
- **Auth**: Supabase maneja tokens, sesiones y magic links. No se guardan contraseñas en texto plano (ni se manejan contraseñas en el MVP si se usa magic link)
- **Sin datos bancarios sensibles**: solo `last_four` como referencia, nunca números completos de tarjeta

## 12. Accesibilidad

- Contraste AA mínimo en ambos temas
- Navegación completa por teclado (tab order lógico, focus visible)
- Labels en todos los inputs
- `aria-live` para feedback de acciones (guardar, borrar)

## 13. Alcance y priorización

### MVP (primera ola)
- Auth + multi-usuario con RLS
- Cuentas y tarjetas (CRUD)
- Categorías (defaults + personalizadas)
- Transacciones (CRUD + filtros + búsqueda)
- MSI (CRUD + cálculo del calendario + proyección a 12+ meses + agregado mensual automático)
- Dashboard con los widgets aprobados
- Meta mensual suave
- Tema claro/oscuro

### Segunda ola
- Suscripciones con proyección anual
- Cuentas múltiples con vista de saldo total
- Reportes básicos: tendencias y comparativas mes vs. mes

### Tercera ola
- Inversiones
- Reportes avanzados: gastos hormiga, promedio histórico
- Importar CSV
- Exportar a CSV/JSON
- Recordatorios por email de próximos cobros

## 14. Riesgos y decisiones abiertas

1. **Lógica del agregado MSI**: la regla "se edita una compra MSI → se recalcula el agregado del mes actual" requiere pruebas cuidadosas. Se cubrirá con tests unitarios del cálculo.
2. **Categoría MSI como default**: es especial porque el agregado siempre cae aquí. Hay que asegurar que exista y no sea borrable.
3. **Timezone**: todos los cálculos de "mes actual" deben usar `America/Mexico_City` consistentemente, no UTC. Esto se centraliza en un helper `currentMonthMX()`.
4. **Supabase free tier**: suficiente para el uso previsto (tú + familiares), pero monitorear límites de filas/ancho de banda si crece.
5. **Primera carga del dashboard**: el cálculo de la proyección a 12 meses involucra recorrer todas las compras MSI activas. Con pocos usuarios y pocas compras no es problema; si crece, agregar caché o materialización.

## 15. Estructura del proyecto (propuesta)

```
finanzas/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (app)/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── msi/
│   │   ├── subscriptions/
│   │   ├── investments/
│   │   ├── accounts/
│   │   ├── reports/
│   │   └── settings/
│   ├── api/
│   └── layout.tsx
├── components/
│   ├── ui/           # shadcn base
│   ├── dashboard/    # widgets
│   ├── msi/          # calendario, simulador, proyección
│   └── shared/       # sidebar, nav, theme toggle
├── lib/
│   ├── supabase/     # clients server/browser
│   ├── db/           # queries tipadas por tabla
│   ├── msi/          # cálculos puros y tests
│   ├── dates/        # helpers timezone MX
│   └── validation/   # esquemas Zod
├── supabase/
│   ├── migrations/   # SQL de tablas + RLS
│   └── seed.sql      # datos de ejemplo para dev
└── docs/
    └── superpowers/specs/
```

Los cálculos puros de MSI (`lib/msi/`) son la pieza con más lógica y la más fácil de testear aisladamente — deben ser funciones puras sin dependencias de DB.
