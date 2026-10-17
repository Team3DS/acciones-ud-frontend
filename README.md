# Soltech ☀

Aplicación de inversión simulada, completamente en español, desarrollada con React, TypeScript y Vite. Identidad visual en verde profundo y lima, logo de sol en SVG y diseño adaptable a teléfonos, tabletas y escritorio.

## Guía rápida para el equipo

Hay dos formas de usar Soltech:

| Modo | Qué permite | Qué necesitas |
| --- | --- | --- |
| **Demostración local** | Registro, correo y MFA simulados, fondeo virtual, compras y ventas con precios de ejemplo | Node.js y las dependencias del proyecto. No requiere claves. |
| **Alpaca · Paper** | Cotizaciones de proveedores, órdenes y posiciones conectadas a una cuenta paper | Lo anterior, una cuenta Alpaca Paper y sus claves configuradas localmente |

**Para abrir la aplicación basta con instalar las dependencias y ejecutar `npm run dev`.** La configuración de Alpaca solo es necesaria para la sección conectada. Frontend y API arrancan juntos; no se necesita una segunda terminal, Docker ni una base de datos para esta versión.

### 1. Preparar la máquina

Instala **Node.js 24 LTS**, que incluye npm, y Git si vas a clonar el repositorio. El mínimo del proyecto es Node.js 22.12. Abre una terminal nueva después de instalar Node y verifica:

```sh
node --version
npm --version
git --version
```

Ejecuta los siguientes comandos desde la raíz del proyecto, donde están `package.json`, `.env.example` y este README.

### 2. Obtener el proyecto e instalar dependencias

Si aún no tienes el repositorio, copia su URL desde **GitHub → Code**. Sustituye `URL_DEL_REPOSITORIO` por esa URL; el comando crea una carpeta llamada `soltech`:

```sh
git clone URL_DEL_REPOSITORIO soltech
cd soltech
npm ci
```

Si ya tienes el proyecto descargado, abre una terminal en su carpeta y ejecuta solamente:

```sh
npm ci
```

`npm ci` instala las versiones del `package-lock.json` incluido en el repositorio. Si vas a agregar o actualizar dependencias, utiliza `npm install` y conserva el archivo de bloqueo actualizado.

### 3. Arrancar la aplicación

```sh
npm run dev
```

Abre **http://127.0.0.1:5173/**. Si ese puerto está ocupado, Vite mostrará otro: utiliza la dirección que aparezca en tu terminal. Mantén esa terminal abierta. Para detener la aplicación, presiona **Ctrl + C**.

Puedes empezar de inmediato con **«Primero quiero explorar el dashboard»**, sin configurar Alpaca. Para recorrer el registro completo, usa correo de prueba, una contraseña con al menos 8 caracteres, una letra y un número, y estos códigos:

| Paso | Código de demostración |
| --- | --- |
| Verificación de correo | `123456` |
| Verificación MFA | `654321` |

### 4. Activar Alpaca Paper

Cada compañero configura sus propias claves en su máquina. El archivo `.env` está excluido de Git; las claves no vienen en el repositorio.

**Crear el archivo de configuración**, desde la raíz del proyecto:

Windows / PowerShell:

```powershell
if (!(Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
```

macOS / Linux:

```sh
if [ ! -f .env ]; then cp .env.example .env; fi
```

Estos comandos conservan un `.env` existente. Abre el archivo `.env` con tu editor y completa los valores que faltan:

```dotenv
ALPACA_API_KEY=
ALPACA_SECRET_KEY=
ALPACA_DATA_FEED=iex
FINNHUB_API_KEY=
PORT=3001
```

| Variable | Cómo completarla |
| --- | --- |
| `ALPACA_API_KEY` | Clave de API de tu cuenta **Paper Trading** de Alpaca |
| `ALPACA_SECRET_KEY` | Clave secreta correspondiente a esa misma cuenta paper |
| `ALPACA_DATA_FEED` | Deja `iex` para comenzar. `sip` requiere permisos de tu suscripción. |
| `FINNHUB_API_KEY` | Opcional. Déjala vacía si no necesitas el respaldo de cotizaciones. |
| `PORT` | Deja `3001`. Se usa con `npm start`; el puerto de desarrollo de Vite se configura por separado. |

Para obtener las claves, entra a [Alpaca](https://app.alpaca.markets/), selecciona el entorno **Paper Trading** y genera sus claves de API. Pega los valores después del signo `=` en tu `.env`. **Usa claves paper, conserva los nombres exactos y no agregues el prefijo `VITE_`.**

Después de guardar `.env`, detén el servidor con **Ctrl + C** y vuelve a ejecutar:

```sh
npm run dev
```

En Soltech, entra al dashboard y selecciona **Alpaca · Paper** en el menú lateral. En el teléfono, abre primero el menú superior. Verás el saldo paper, el estado del mercado, las cotizaciones, las posiciones y las órdenes de esa cuenta.

El fondeo de la demostración local no agrega dinero a Alpaca. Para disponer de saldo conectado, administra los fondos virtuales desde tu cuenta **Paper Trading** en Alpaca.

### 5. Comprobar la conexión

Con el servidor de desarrollo abierto, visita:

```text
http://127.0.0.1:5173/api/paper/status
```

Si Vite eligió otro puerto, cámbialo también en esta dirección. Con ambas claves presentes, la respuesta será similar a:

```json
{"configured":true,"feed":"iex","mode":"paper"}
```

`configured: true` confirma que el servidor encontró ambas claves; **no comprueba que sean válidas ni que Alpaca esté disponible**. Para verificar esas condiciones, abre **Alpaca · Paper** y comprueba que se carguen los datos de la cuenta. Con `configured: false`, revisa que `.env` esté en la raíz, que ambos valores estén completos y que hayas reiniciado Vite.

### 6. Probar una compra conectada

1. Abre **Alpaca · Paper** y comprueba que tu cuenta tenga saldo virtual y que el mercado esté abierto.
2. Selecciona **AAPL** (NASDAQ) o **JNJ** (NYSE) y pulsa **Actualizar precio**.
3. Elige **Comprar** e ingresa una cantidad entera de acciones.
4. Comprueba el importe estimado y el margen de validación del 3 %; pulsa **Comprar … en paper**.
5. Observa el estado de la orden. **Aceptada** significa que Alpaca la recibió; **Ejecutada** confirma su llenado completo.
6. Revisa la posición en **Mi portafolio · Alpaca**, la orden y la notificación de la sesión. Contrasta los datos con tu panel de Alpaca.

La sesión regular es de **9:30 a 16:00, hora de Nueva York**, sujeta al calendario del mercado. La aplicación consulta el reloj de Alpaca para aplicar festivos, cierres especiales y horario de verano. Durante fines de semana o con el mercado cerrado, es correcto que no permita enviar la orden.

## Comandos disponibles

| Comando | Uso |
| --- | --- |
| `npm ci` | Instalar las versiones registradas en `package-lock.json` |
| `npm run dev` | Iniciar frontend y API paper juntos para desarrollo |
| `npm test` | Ejecutar las pruebas automáticas, sin enviar órdenes a Alpaca |
| `npm run build` | Comprobar TypeScript y generar la carpeta `dist/` |
| `npm start` | Servir `dist/` y la API paper local en http://127.0.0.1:3001/ |
| `npm run preview` | Revisar únicamente el frontend compilado, sin la API paper |

Para ejecutar la compilación local completa:

```sh
npm ci
npm run build
npm start
```

Abre **http://127.0.0.1:3001/**, o el puerto configurado en `PORT`. Configura `.env` antes de ejecutar `npm start` si necesitas Alpaca. Cuando cambies código del frontend, vuelve a ejecutar `npm run build`.

El proyecto también declara pnpm en `packageManager`. Si el equipo elige usarlo, los equivalentes son `corepack pnpm install` y `corepack pnpm dev`. Para seguir esta guía y reproducir el bloqueo incluido, utiliza npm de forma consistente.

## Solución de problemas

| Problema | Qué revisar |
| --- | --- |
| `node` o `npm` no se reconocen | Instala Node.js 24 y abre una terminal nueva. |
| PowerShell bloquea `npm.ps1` | Usa `npm.cmd ci` y `npm.cmd run dev`; los demás comandos admiten el mismo reemplazo por `npm.cmd`. |
| No encuentra `package.json` | Abre la terminal en la raíz del repositorio, no en `src/` ni en `server/`. |
| `npm ci` informa que falta el archivo de bloqueo | Comprueba que descargaste el repositorio completo con `package-lock.json`. Si estás preparando el proyecto sin ese archivo, ejecuta `npm install`. |
| La página no abre | Mantén `npm run dev` activo y copia la URL que imprime Vite. Verifica el puerto. |
| Sigue apareciendo la pantalla para configurar Alpaca | Revisa el nombre `.env` (sin extensión `.txt`), su ubicación, ambas claves y reinicia el servidor. |
| Alpaca rechaza las credenciales | Comprueba que sean de Paper Trading, que correspondan entre sí y que no estén revocadas. |
| El feed devuelve un error de permisos | Usa `ALPACA_DATA_FEED=iex`, salvo que tengas acceso a SIP, y reinicia. |
| El mercado está cerrado | Espera a la siguiente sesión indicada por la aplicación. La demo local sigue disponible. |
| Cotización desactualizada o límite de consultas | Actualiza después de esperar; revisa la conexión y los permisos del proveedor. No se permite comprar con cotizaciones viejas. |
| Fondos insuficientes | Revisa el efectivo paper y el poder de compra. La validación exige el estimado más un margen del 3 %. |
| Una orden queda pendiente o la conexión falla | Conserva su identificador y consulta su estado en Alpaca. No repitas la compra: podría haber sido recibida. La aplicación continúa el seguimiento con el mismo identificador. |
| La API no funciona con `npm run preview` | Usa `npm run dev`, o ejecuta `npm run build` seguido de `npm start`. |
| `npm start` no encuentra archivos | Ejecuta primero `npm run build`. |

Para compartir el proyecto, sube el código, `package-lock.json` y `.env.example`. Cada compañero instala sus dependencias y configura sus propias claves. `.gitignore` excluye `.env`, `node_modules/` y `dist/`.

## Recorrido de demostración

1. **Registro:** nombre, apellido, correo, contraseña y residencia fiscal. La contraseña requiere 8 caracteres, una letra y un número; nunca se almacena.
2. **Correo:** ingresa **123456**. Puedes simular el reenvío o corregir tu dirección.
3. **MFA:** ingresa **654321** para simular la validación del segundo factor.
4. **Cuenta Alpaca:** acepta el uso de fondos ficticios y crea una cuenta de práctica local.
5. **Fondeo:** elige entre 100 y 1.000.000 USD virtuales.
6. **Dashboard:** consulta el resumen, explora activos, compra y vende acciones enteras, revisa órdenes y administra favoritos. Puedes agregar más fondos virtuales.

El botón «Primero quiero explorar el dashboard» abre una cuenta de ejemplo con 100.000 USD. El avance, el perfil y las operaciones se conservan en `localStorage` bajo `soltech.account`. «Cerrar sesión» vuelve al acceso de demostración, conservando los datos del navegador. Este acceso no autentica identidades ni comprueba contraseñas; permite retomar la demostración local.

## Estructura

```text
public/soltech.svg       Logo y favicon
server/                 API local y conexión protegida con Alpaca Paper
.env.example            Plantilla de configuración sin secretos
src/
├── assets/              Recursos adicionales
├── components/Icon.tsx  Iconos SVG y marca
├── features/paper/      Interfaz de cotizaciones, órdenes y portafolio en Alpaca
├── hooks/               Reservado para hooks compartidos
├── pages/
│   ├── Onboarding.tsx   Registro, correo, MFA, cuenta y fondeo
│   └── Dashboard.tsx    Resumen, portafolio, mercado, órdenes y favoritos
├── services/market.ts   Activos y precios de demostración
├── services/paper.ts    Cliente de la API conectada
├── store/account.ts    Estado inicial y recuperación local
├── styles/global.css   Diseño y puntos de adaptación
├── types/index.ts      Tipos de dominio
├── utils/              Reservado para utilidades
├── App.tsx             Estado y navegación principal
└── main.tsx            Arranque de React
tests/                  Pruebas de contabilidad, API y proveedores controlados
```

El alias `@` apunta a `src`. Se utiliza CSS propio, sin frameworks de estilos ni dependencias de iconos. Las fuentes DM Sans y Manrope se solicitan a Google Fonts; existen fuentes locales de respaldo.

## NYSE y NASDAQ con Alpaca Paper

La opción **Alpaca · Paper** del menú conecta cotizaciones, órdenes, ejecuciones y posiciones a una cuenta paper existente. Es independiente del saldo y las operaciones de la demostración local.

1. Crea una cuenta paper en [Alpaca](https://app.alpaca.markets/) y genera sus claves de **Paper Trading**.
2. Copia `.env.example` como `.env` en la raíz del proyecto. Completa `ALPACA_API_KEY` y `ALPACA_SECRET_KEY` localmente. No compartas tus claves en el chat ni las subas al repositorio.
3. Mantén `ALPACA_DATA_FEED=iex` para el feed de cobertura limitada del plan gratuito. `sip` requiere permisos de tu suscripción.
4. Opcionalmente, configura `FINNHUB_API_KEY` para consultar el último precio con Finnhub si falla la cotización de Alpaca. Este respaldo no proporciona bid/ask ni ejecuta órdenes.
5. Reinicia `npm run dev`. El mismo servidor Vite atiende el frontend y `/api/paper/*`.
6. Entra al dashboard, abre **Alpaca · Paper**, selecciona un activo y consulta su cotización. Durante la sesión regular, elige cantidad y compra o vende con fondos paper.

Para la compilación local usa `npm run build` y `npm start`. `npm run preview` solo sirve el frontend, sin API.

| Bolsa | Símbolos | Sesión regular |
| --- | --- | --- |
| NYSE | JNJ, JPM, XOM | 9:30–16:00, America/New_York |
| NASDAQ | AAPL, MSFT, GOOGL, AMZN, META, TSLA, NVDA | 9:30–16:00, America/New_York |

El reloj de Alpaca determina la apertura, los festivos, los cierres especiales y el horario de verano. Las órdenes al mercado se bloquean fuera de la sesión regular; no se encolan para el siguiente día.

### Validaciones y confirmaciones

- El backend valida el símbolo, bolsa, estado negociable, cuenta activa, reloj oficial y cantidad entera. Solo admite compras y ventas de posiciones propias, sin ventas en corto.
- Antes de comprar, exige una cotización de hasta 90 segundos y comprueba el menor valor entre efectivo y poder de compra, incluyendo un margen del 3 %. Alpaca realiza la validación definitiva; este margen no limita el precio de una orden de mercado.
- Solo se llama a `https://paper-api.alpaca.markets`. No existe un modo para enviar órdenes a cuentas con dinero real.
- Se busca responder dentro de cinco segundos con ejecución confirmada o estado pendiente. **No se garantiza una ejecución en cinco segundos**: depende del mercado, la red y Alpaca. El servidor limita comprobaciones y consultas para intentar devolver un estado en unos 4,8 segundos; una interrupción externa puede superar el objetivo de extremo a extremo.
- Se distinguen las órdenes recibidas, aceptadas, ejecutadas parcialmente, ejecutadas, rechazadas, canceladas y expiradas. Solo `filled` significa ejecución completa.
- Cada intento conserva un `client_order_id`. Los duplicados concurrentes se agrupan; un timeout ambiguo no provoca un reenvío automático. El identificador pendiente se conserva en `sessionStorage` para retomar el seguimiento al recargar la misma pestaña. Si Alpaca no confirma su recepción, consulta ese identificador en Alpaca antes de volver a operar; la interfaz bloquea nuevas órdenes mientras haya incertidumbre.
- El cliente consulta órdenes pendientes cada dos segundos, actualiza posiciones y cuenta al detectar cambios y muestra notificaciones. La cuenta se sincroniza también cada 15 segundos y la cotización seleccionada cada 20 segundos. Si una actualización falla, se informa que los valores anteriores pueden estar desactualizados.
- Los precios de respaldo se identifican como último precio; nunca se presentan como bid/ask. Los precios de ejecución provienen de Alpaca, no del precio mostrado antes de operar.

### API y archivos

| Ruta | Función |
| --- | --- |
| `GET /api/paper/status` | Configuración disponible, sin exponer claves |
| `GET /api/paper/quote?symbol=AAPL` | Cotización con fuente y fecha |
| `GET /api/paper/snapshot` | Cuenta, posiciones, últimas 100 órdenes y reloj |
| `POST /api/paper/orders` | Orden de mercado validada con identificador único |
| `GET /api/paper/order?clientOrderId=…` | Seguimiento y recuperación de una orden |

El servidor está en `server/`, la interfaz conectada en `src/features/paper/`, el cliente API en `src/services/paper.ts` y los contratos en `src/types/paper.ts`.

Esta integración es **local, de una sola cuenta paper**. Los secretos se cargan desde `.env` en Node, nunca se envían al navegador ni se almacenan en `localStorage`. La API restringe el host a localhost/127.0.0.1 y exige solicitudes del mismo origen. El acceso del onboarding sigue siendo demostrativo: no es autenticación real del backend. No expongas este servidor a Internet ni lo despliegues para varios usuarios sin agregar autenticación de servidor, autorización por cuenta, protección de secretos y límites de uso.

### Comprobación

`npm test` verifica la contabilidad local y la integración mediante respuestas controladas de proveedores: ambos mercados, fondos insuficientes, sesión cerrada, cuenta restringida, cotizaciones viejas, ventas sin posiciones, duplicados, timeouts, ejecuciones parciales, respaldo y protección del origen. Estas pruebas no envían órdenes a Alpaca y no certifican la latencia de una conexión real.

La prueba de aceptación conectada requiere claves paper, saldo y mercado abierto: consultar AAPL o JNJ, enviar una compra, comprobar `filled`, contrastar cantidad/precio con Alpaca, verificar portafolio actualizado y notificación. En un fin de semana o festivo, el resultado esperado es mercado cerrado y ausencia de envío.

Referencias: [órdenes de Alpaca](https://docs.alpaca.markets/us/docs/orders-at-alpaca), [paper trading](https://docs.alpaca.markets/us/docs/paper-trading), [cotizaciones y feeds](https://docs.alpaca.markets/us/reference/stocklatestquotesingle-1), [identificadores de órdenes](https://docs.alpaca.markets/us/reference/getorderbyclientorderid), [Finnhub Quote](https://finnhub.io/docs/api/quote).

## Alcance del registro y la demostración local

El registro no envía correos, no configura MFA real ni crea cuentas en Alpaca. En las secciones locales los precios siguen siendo fijos e ilustrativos; el gráfico mantiene el valor actual y el selector de período cambia el eje, sin representar un historial real. El fondeo local no modifica el saldo en Alpaca: ese saldo se administra desde la cuenta paper del proveedor.

La autenticación, correo, MFA, creación de cuentas y fondeo reales requieren un backend con sesiones y persistencia segura. Las claves secretas nunca deben ponerse en variables `VITE_*`, código del cliente ni `localStorage`.

Los textos de términos y privacidad muestran información contextual de la demostración; deben reemplazarse por documentos legales definitivos antes de un lanzamiento real.
