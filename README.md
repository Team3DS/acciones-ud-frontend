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
| `VITE_QUOTES_WS_URL` | Opcional. URL de transporte STOMP que publica el gateway, por ejemplo `/api/v1/market/ws/quotes/websocket`. Mientras no haya conexión, las vistas consultan las cotizaciones REST cada 15 segundos. Requiere que el gateway entregue a M4 la ruta `/market/ws/quotes`; hoy la reenvía con el prefijo `/api/v1`. |
| `VITE_DEMO_MODE` | Con `true`, activa el prototipo local con sus datos de práctica. |

## Acceso y servicios

El registro envía los datos a Identidad. El inicio de sesión abre el desafío MFA y la pantalla solicita el código enviado por el backend. El cliente admite tanto los tokens que llegan al verificar el código como la variante de M1 que entrega tokens preliminares al iniciar sesión y devuelve `verified` en la verificación. En este último caso los tokens preliminares se mantienen solo en memoria hasta recibir la confirmación.

La sesión se conserva en `sessionStorage` por pestaña y gateway. Las peticiones protegidas llevan JWT y todas incluyen `X-Correlation-ID`. Los envíos POST y PATCH incluyen `Idempotency-Key`. Las solicitudes concurrentes comparten una renovación de sesión ante un 401. Al cerrar sesión se solicita la revocación del refresh token.

| Pantalla | Datos y operaciones |
| --- | --- |
| Resumen, mercado y favoritos | Catálogo paginado con búsqueda parcial por símbolo o empresa (`query` de M3), precios, histórico, mapa del mercado y estado del mercado. Sin WebSocket, los precios se consultan cada 15 segundos. Los favoritos son una preferencia del navegador asociada al usuario. |
| Mis fondos | Efectivo disponible, reservado y total, movimientos paginados, depósitos de hasta USD 1.000.000 cada uno y retiros hasta el saldo disponible. Los montos se validan antes de enviarse a M2. |
| Portafolio, órdenes y protección | Posiciones y valoración del usuario, envío de órdenes, consulta de estado, ejecuciones parciales y cancelación. Una orden aceptada se refleja con el estado informado por M5. |
| Notificaciones y perfil | Perfil de Identidad, lectura de avisos, preferencias y alertas de precio. |
| Premium y reportes | Planes, suscripción, enlace de Stripe Checkout, facturas y resumen de ejecuciones exportable en CSV. |

### Compatibilidad del backend

La implementación publicada en `main` del backend en la revisión `8ece707` difiere de la wiki en varios puntos. M1 genera el desafío MFA, pero esa revisión todavía requiere completar la entrega del código al usuario y la ruta `/users/me`. M4, M6 y M8 tienen implementaciones en ramas de funcionalidad. M5 y M10 todavía son esqueletos en esa revisión. El despliegue que sirve al frontend debe publicar los módulos correspondientes y enrutar también `/market/**` y `/billing/**` bajo `/api/v1`. Cada vista muestra los errores que devuelve su servicio. [Repositorio del backend](https://github.com/Team3DS/acciones-ud-backend)

## Idioma

El selector de idioma está junto al de apariencia en el acceso, en la barra del espacio de trabajo y en el registro del prototipo. La elección se conserva en `acciones-ud.language`, se sincroniza entre pestañas y actualiza el atributo `lang` del documento. En la primera visita se usa el idioma del navegador: inglés si el navegador está en inglés y español en cualquier otro caso.

Los textos están en `src/i18n/es.json` y `src/i18n/en.json`, con las mismas claves en ambos archivos. Los componentes los leen con `useI18n()`:

```tsx
const { t, money, percent, date } = useI18n()
t('stats.portfolioValue')            // Valor de tu portafolio · Portfolio value
t('dash.tradeDone', { side, quantity, symbol })
money(97021.85)                      // US$ 97.021,85 · $97,021.85
```

Para agregar un texto, crea la misma clave en los dos archivos. Los montos se muestran siempre en USD; solo cambia el formato de números y fechas. Los símbolos y nombres de las empresas no se traducen. Los archivos CSV conservan sus encabezados en español para mantener un formato estable.

## Pruebas y publicación

```bash
npm test
npm run build
npm run preview
```

Las pruebas del cliente HTTP cubren registro, MFA, errores del gateway, idempotencia, renovación concurrente y cierre de sesión. La suite conserva las pruebas de cálculos y reportes del prototipo. También comprueban que ambos idiomas tengan las mismas claves y variables. La compilación genera el sitio estático en `dist/`.

Publica el contenido de `dist/`. Para mantener la configuración predeterminada en producción, configura el servidor web para reenviar `/api/v1/**` al gateway antes de servir archivos estáticos. Si compilas con una URL absoluta, habilita en el gateway el origen del frontend y las cabeceras `Authorization`, `Content-Type`, `Idempotency-Key` y `X-Correlation-ID`. Las variables `VITE_*` se incorporan al cliente y deben contener únicamente configuración pública.

## Demostración local

Para recorrer el prototipo anterior activa `VITE_DEMO_MODE=true` en `.env.local` y reinicia Vite. Conserva sus saldos, operaciones y recorrido de registro en `localStorage` bajo `soltech.account`. El modo conectado utiliza exclusivamente la sesión de Identidad y los datos de los servicios para la cuenta. El tema claro, oscuro o del sistema se conserva en ambos modos.

## Contenido del repositorio

```text
public/             Logo y archivos públicos
src/components/     Componentes compartidos y selectores de tema
src/features/       Pantallas del modo conectado (account/) y del prototipo
src/hooks/          Consultas a servicios y cotizaciones en tiempo real
src/i18n/           Textos en español e inglés y selector de idioma
src/pages/          Acceso, espacio de trabajo y prototipo
src/services/       Cliente del gateway y datos del prototipo
src/store/          Estado local del prototipo
src/styles/         Estilos responsivos y temas
src/types/          Tipos del frontend
src/utils/          Cálculos y exportación de reportes
tests/              Pruebas del cliente HTTP y de utilidades
```

`dist/` se genera al compilar y no se sube al repositorio. `package-lock.json` sí se conserva para reproducir la instalación.
