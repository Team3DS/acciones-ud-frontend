# Acciones UD · Frontend

Interfaz de inversión de Team3DS con React, TypeScript y Vite. El modo predeterminado usa el gateway de Acciones UD y los contratos REST v1.1. [Contratos REST y eventos](https://github.com/Team3DS/acciones-ud-backend/wiki/Contratos-REST-y-Eventos)

## Desarrollo

Con Node.js 22.18 o superior y el gateway ejecutándose en el puerto 8080, inicia el frontend con estos comandos.

```bash
npm ci
npm run dev
```

Abre la dirección que muestra Vite. Las solicitudes del navegador a `/api/v1` pasan por el proxy de desarrollo hacia `http://127.0.0.1:8080`. Para usar otro destino, copia `.env.example` a `.env.local`, cambia `API_PROXY_TARGET` y reinicia Vite.

| Variable | Uso |
| --- | --- |
| `API_PROXY_TARGET` | Origen del gateway para el proxy de desarrollo y `npm run preview`. |
| `VITE_API_BASE_URL` | Base REST incluida en la compilación. Por defecto, `/api/v1`. Para un gateway en otro origen, incluye el prefijo, por ejemplo `https://gateway.ejemplo.edu/api/v1`. |
| `VITE_IDENTITY_CONTRACT` | Por defecto usa el registro v1.1 con `telefono` y `solicitaReporteMensual`. Usa `main` para el registro de M1 en la revisión `8ece707`, que recibe `celular`. |
| `VITE_QUOTES_WS_URL` | Opcional. URL de transporte STOMP que publica el gateway. Para el endpoint SockJS de M4, indica la ruta que termina en `/websocket`. Sin esta variable, las vistas usan las cotizaciones REST al abrirse y al seleccionar **Actualizar**. |
| `VITE_DEMO_MODE` | Con `true`, activa el prototipo local con sus datos de práctica. |

## Acceso y servicios

El registro envía los datos a Identidad. El inicio de sesión abre el desafío MFA y la pantalla solicita el código enviado por el backend. El cliente admite tanto los tokens que llegan al verificar el código como la variante de M1 que entrega tokens preliminares al iniciar sesión y devuelve `verified` en la verificación. En este último caso los tokens preliminares se mantienen solo en memoria hasta recibir la confirmación.

La sesión se conserva en `sessionStorage` por pestaña y gateway. Las peticiones protegidas llevan JWT y todas incluyen `X-Correlation-ID`. Los envíos POST y PATCH incluyen `Idempotency-Key`. Las solicitudes concurrentes comparten una renovación de sesión ante un 401. Al cerrar sesión se solicita la revocación del refresh token.

| Pantalla | Datos y operaciones |
| --- | --- |
| Resumen, mercado y favoritos | Catálogo paginado, precios, histórico, mapa del mercado y estado del mercado. Los favoritos son una preferencia del navegador asociada al usuario. |
| Mis fondos | Efectivo disponible, reservado y total, movimientos paginados y retiros. Los administradores también pueden registrar depósitos. |
| Portafolio, órdenes y protección | Posiciones y valoración del usuario, envío de órdenes, consulta de estado, ejecuciones parciales y cancelación. Una orden aceptada se refleja con el estado informado por M5. |
| Notificaciones y perfil | Perfil de Identidad, lectura de avisos, preferencias y alertas de precio. |
| Premium y reportes | Planes, suscripción, enlace de Stripe Checkout, facturas y resumen de ejecuciones exportable en CSV. |

### Compatibilidad del backend

La implementación publicada en `main` del backend en la revisión `8ece707` difiere de la wiki en varios puntos. M1 genera el desafío MFA, pero esa revisión todavía requiere completar la entrega del código al usuario y la ruta `/users/me`. M4, M6 y M8 tienen implementaciones en ramas de funcionalidad. M5 y M10 todavía son esqueletos en esa revisión. El despliegue que sirve al frontend debe publicar los módulos correspondientes y enrutar también `/market/**` y `/billing/**` bajo `/api/v1`. Cada vista muestra los errores que devuelve su servicio. [Repositorio del backend](https://github.com/Team3DS/acciones-ud-backend)

## Pruebas y publicación

```bash
npm test
npm run build
npm run preview
```

Las pruebas del cliente HTTP cubren registro, MFA, errores del gateway, idempotencia, renovación concurrente y cierre de sesión. La suite conserva las pruebas de cálculos y reportes del prototipo.

Publica el contenido de `dist/`. Para mantener la configuración predeterminada en producción, configura el servidor web para reenviar `/api/v1/**` al gateway antes de servir archivos estáticos. Si compilas con una URL absoluta, habilita en el gateway el origen del frontend y las cabeceras `Authorization`, `Content-Type`, `Idempotency-Key` y `X-Correlation-ID`. Las variables `VITE_*` se incorporan al cliente y deben contener únicamente configuración pública.

## Demostración local

Para recorrer el prototipo anterior activa `VITE_DEMO_MODE=true` en `.env.local` y reinicia Vite. Conserva sus saldos, operaciones y recorrido de registro en `localStorage` bajo `soltech.account`. El modo conectado utiliza exclusivamente la sesión de Identidad y los datos de los servicios para la cuenta. El tema claro, oscuro o del sistema se conserva en ambos modos.
