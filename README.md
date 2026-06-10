# loan-service — Servicio de Préstamos y Pagos

Microservicio NestJS que gestiona el **ciclo de vida del préstamo**: solicitud, aprobación/rechazo,
pagos (con interés sobre saldo) y consultas de balance.

- **Puerto host:** 3002 (interno 3001) · **Prefijo:** `/api/v1` · **Swagger:** http://localhost:3002/api/docs
- **BD:** PostgreSQL `loans-service` (puerto host 5434)

## Rol dentro del sistema
```
frontend ─► /loans/request, /loans/:id/payments
loan-service ─► HTTP ─► user-service (GET /api/v1/profiles/:id)   # capacidad y enriquecimiento
admin-service ─► HTTP ─► loan-service (GET /loans/user/:id, /loans/pending)  # análisis y aprobación
```
**Consume** user-service (perfiles) con **circuit breaker + reintentos**: si user-service no responde,
devuelve un perfil *degradado* (marcado `degraded:true`) en vez de ocultar el fallo.

## Entidades
- **Loan**: `id`, `userId`, `amount`, `interestRate` (**tasa MENSUAL**), `status` (máquina de estados),
  `type` (enum `LoanType`: `monthly_interest` | `fixed_installments`), `termMonths`, `installmentValue`,
  `paymentFrequency`, `remainingBalance`. Métodos: `calculateInterest()`, `canTransitionTo()`.
- **Payment**: `loanId`, `amountPaid`, `interestCharged`, `capitalPayment`, `remainingBalance`, `date`.
- **PaymentIdempotency**: `(loanId, idempotencyKey)` → `paymentId` (evita pagos duplicados).

### Estados del préstamo (state machine)
`solicitud → pendiente_aprobacion → activo → pagado` (+ `rechazado`/`cancelado`). Se bloquean
transiciones inválidas (p.ej. `pagado → activo`).

## Endpoints (`/api/v1/loans`)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/loans/request` | Solicitar préstamo (valida capacidad antes de crear) |
| PUT | `/loans/:id/approve` | Aprobar (define interés, plazo, cuota) → `activo` |
| PUT | `/loans/:id/reject` | Rechazar |
| POST | `/loans/:id/payments` | Pago automático (interés sobre saldo). Acepta `Idempotency-Key` |
| POST | `/loans/:id/payments/manual` | Pago manual (admin: capital + fecha). Acepta `Idempotency-Key` |
| GET | `/loans` · `/loans/:id` | Listado / detalle |
| GET | `/loans/my/:userId` | Préstamos del usuario |
| GET | `/loans/user/:userId` | Versión enriquecida (para análisis crediticio) |
| GET | `/loans/balance/:userId` | Balance agregado |
| GET | `/loans/pending?page=&limit=` | Pendientes (enriquecidos con perfil) |
| GET | `/loans/pending/search/:documentNumber` | Pendientes por documento |
| GET | `/loans/:id/payments` | Historial de pagos |
| GET | `/health/liveness` · `/health/readiness` | Health (readiness verifica BD + user-service) |

## Funciones básicas / reglas
- Interés del periodo = `remainingBalance * (interestRate/100)` (**mensual**, coherente en todo el servicio).
- **Idempotencia:** reintentos con el mismo header `Idempotency-Key` devuelven el pago ya creado.
- **Capacidad de endeudamiento:** al solicitar, compara la exposición (saldos activos + monto pedido)
  contra `LOAN_MAX_INCOME_MULTIPLIER × monthly_income` (perfil). Si excede, rechaza con mensaje claro.
- Al llegar `remainingBalance ≤ 0`, el préstamo pasa a `pagado`.

## Variables de entorno (ver `.env.example`)
`NODE_ENV`, `PORT=3001`, `DATABASE_*`, `USER_SERVICE_URL`, `PROFILE_TIMEOUT_MS`, `PROFILE_RESET_MS`,
`JWT_SECRET`, `CORS_ORIGINS`, `THROTTLE_*`, `LOAN_MAX_INCOME_MULTIPLIER` (def. 12).

## Cómo testear
Vía `../loans-software` (recomendado, así user-service está disponible). Standalone necesita
user-service arriba para el flujo completo.
```bash
npm install && cp .env.example .env && npm run start:dev
npm run build
# Pago idempotente (mismo key NO duplica)
curl -X POST http://localhost:3002/api/v1/loans/<loanId>/payments \
  -H "Content-Type: application/json" -H "Idempotency-Key: abc-123" -d '{"amount":50000}'
```

## Notas para nuevos administradores del código
- Estructura hexagonal. Cliente HTTP a user-service: `infrastructure/adapters/in/ProfileExternalHTTP.ts`
  (opossum + axios-retry).
- `synchronize` gateado por `NODE_ENV` (en dev crea tablas; en prod usar migraciones).
- Test pre-existente roto: `app.controller.spec.ts` importa archivos inexistentes (el build sí pasa).
- Cross-cutting: throttler, helmet, pino, terminus, versionado `/api/v1`.
