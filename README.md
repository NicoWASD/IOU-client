# IOU · Client

Frontend de **IOU** ("I owe you"), una app web para registrar gastos compartidos en grupo, ver quién le debe a quién y saldar deudas con la mínima cantidad de transferencias.

[![CI](https://github.com/NicoWASD/IOU-client/actions/workflows/ci.yml/badge.svg)](https://github.com/NicoWASD/IOU-client/actions/workflows/ci.yml)

> Estado: **H0 a H5 completos** (todas las historias del MVP). Detalle en el [informe de QA](https://github.com/NicoWASD/IOU-backend/blob/main/docs/qa.md).

## Links

| | |
|---|---|
| App en producción | **https://iou-client.vercel.app** |
| API en producción | https://iou-backend.onrender.com/api/health |
| Repo del backend | [IOU-backend](https://github.com/NicoWASD/IOU-backend) |

> **Aviso:** la API corre en el plan gratuito de Render, que se duerme tras 15 minutos sin uso. La primera carga puede tardar hasta un minuto; la app muestra "Despertando el servidor…" mientras tanto.

## Probalo

Entrá a **https://iou-client.vercel.app** con el usuario demo:

| Email | Contraseña |
|---|---|
| `ana.demo@iou.test` | `demo-iou-2026` |

También existen `bruno.demo@iou.test` y `carla.demo@iou.test` (misma contraseña). Tienen dos grupos, "Viaje a Bariloche" y "Depto compartido", con gastos de los tres tipos y pagos. Son cuentas públicas de demostración: no guardes datos reales.

## Qué hace

- **Grupos:** crear, editar, sumar miembros por email y quitarlos.
- **Gastos:** en partes iguales, por montos o por porcentajes, con la suma en vivo; editar, eliminar y Deshacer.
- **Balances:** quién debe y a quién le deben, y la liquidación con la menor cantidad de transferencias.
- **Pagos:** registrar (también desde un vale de la liquidación), ver el historial y eliminar.
- **Archivar** un grupo cuando están todos a mano: queda en solo lectura.

## Arquitectura

```
src/pages        pantallas (rutas con carga diferida)
src/components   UI por dominio (grupos, gastos, balances) y shadcn/ui
src/api          cliente HTTP y hooks de TanStack Query por recurso
src/lib          dinero en centavos (money.ts), fechas y utilidades
```

El dinero se maneja en centavos y solo se formatea al mostrarlo (`$ 1.234,56`). Las reglas de negocio se validan en el back; el front solo anticipa errores para la experiencia de uso.

## Documentación

La especificación, las historias de usuario, el sistema de diseño y el informe de QA están en el repo del backend: [IOU-backend/docs](https://github.com/NicoWASD/IOU-backend/tree/main/docs).

En este repo:
- `docs/prototipo-d0.html`: prototipo navegable del diseño.
- `docs/marca-iou.html`: hoja de marca del logo.
- `public/brand/`: logo, ícono y favicon en SVG (se regeneran con `npm run brand`).

## Stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 · shadcn/ui · TanStack Query · Zod · lucide · sonner · Vitest + Testing Library · Docker (nginx) · GitHub Actions

## Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL de la API, incluido `/api`. Vite la incrusta **al compilar**. |

Copiá `.env.example` a `.env.local` para desarrollo.

## Cómo ejecutarlo

### Con Node (22 o superior)

```bash
npm ci
npm run dev
```

Abrí http://localhost:5173. Necesitás la API corriendo (ver [IOU-backend](https://github.com/NicoWASD/IOU-backend)). Otros scripts: `npm test`, `npm run lint`, `npm run typecheck` y `npm run build`.

### Con Docker (sin Compose)

```bash
docker build -t iou-client --build-arg VITE_API_URL=http://localhost:3000/api .
docker run --rm --name iou-client -p 8080:80 iou-client
```

Abrí http://localhost:8080. nginx sirve la app y redirige cualquier ruta a `index.html`.

## Deploy

Vercel, conectado a este repo: cada push a `main` despliega a producción. `vercel.json` redirige todas las rutas a `index.html`.
