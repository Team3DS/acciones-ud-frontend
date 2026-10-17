<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:7aa2f7,100:bb9af7&height=200&section=header&text=Soltech&fontSize=45&fontAlignY=35&desc=Frontend%20%C2%B7%20Team3DS&descAlignY=57&descSize=16" width="100%" alt="Soltech · Team3DS"/>

<img src="public/soltech.svg" width="72" alt="Soltech: símbolo de sol"/>

<img src="https://github.com/Team3DS.png" width="110" alt="Team3DS"/>

[![React](https://img.shields.io/badge/React-7dcfff?style=for-the-badge)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-7aa2f7?style=for-the-badge)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-9ece6a?style=for-the-badge)](https://vite.dev)
[![Team3DS](https://img.shields.io/badge/Team3DS-73daca?style=for-the-badge)](https://github.com/Team3DS)

**Tu futuro empieza aquí.**

Interfaz en español · Diseño responsivo · Inversión simulada · Alpaca Paper

</div>

> ### `Sobre el repositorio`

**Soltech** es la aplicación web de inversión y aprendizaje financiero del equipo [Team3DS](https://github.com/Team3DS). Integra un recorrido de registro, un dashboard personalizado, operaciones de práctica, una conexión local con Alpaca Paper y reportes de transacciones y cargos por período.

**El proyecto incluye un frontend y un backend local básico desarrollado para permitir la simulación de inversión y las pruebas con Alpaca Paper.** Este backend está en `server/` y sirve de apoyo al prototipo; todavía no implementa autenticación real ni una base de datos propia.

La identidad de la aplicación utiliza verde profundo y lima, tipografías DM Sans y Manrope y un símbolo de sol en SVG como logo provisional.

| Modalidad | Funcionamiento | Requisitos |
| --- | --- | --- |
| **Demostración local** | Datos y fondos ficticios guardados en el navegador; disponible sin claves | Node.js y dependencias del proyecto |
| **Alpaca Paper** | Cotizaciones de proveedores y órdenes, ejecuciones y posiciones en una cuenta paper existente | Claves paper configuradas en el servidor local |

El registro, correo, MFA y creación de cuenta del onboarding son demostrativos. La conexión con Alpaca se configura por separado y utiliza exclusivamente dinero virtual.

> ### `Backend básico para la simulación`

Se desarrolló un **backend local en Node.js** para conectar la interfaz con los servicios necesarios para una simulación básica de inversión, conservando las claves de los proveedores en el servidor.

| Responsabilidad | Qué hace el backend |
| --- | --- |
| Configuración | Carga las claves de Alpaca y Finnhub desde `.env`, sin enviarlas al navegador. |
| Cotizaciones | Consulta precios de Alpaca y, si se configura, utiliza Finnhub como respaldo. |
| Cuenta y mercado | Consulta saldo, posiciones y reloj oficial del mercado. |
| Órdenes paper | Valida fondos, activo, horario y cantidad; envía órdenes exclusivamente al entorno paper de Alpaca y consulta su ejecución. |
| Reportes | Obtiene el historial paginado de ejecuciones y cargos; el frontend filtra, agrupa y exporta esos datos. |
| Ejecución local | Atiende `/api/paper/*` junto con Vite mediante `npm run dev`; con `npm start` sirve la aplicación compilada y su API. |

La **demostración sin claves** realiza sus operaciones en el frontend con precios y fondos ficticios, y conserva los datos en el navegador. La modalidad **Alpaca Paper** utiliza el backend local y una cuenta paper existente para consultar datos y tramitar operaciones con dinero virtual.

El registro, inicio de sesión, verificación de correo, MFA, creación de cuenta y fondeo del onboarding **siguen siendo demostrativos**. El backend básico no envía correos, no autentica usuarios ni crea cuentas de Alpaca. Para una versión con usuarios reales se debe ampliar con autenticación, sesiones, autorización por cuenta y persistencia segura.

> ### `Stack`

1. **React con TypeScript** para la interfaz y los tipos de dominio.
2. **Vite** como empaquetador y servidor de desarrollo.
3. Alias **`@` → `src`** para importaciones cortas.
4. **CSS propio** con puntos de adaptación para teléfonos, tabletas y escritorio; sin Bootstrap ni Tailwind.
5. **Node.js** para la API local, carga de variables de entorno y llamadas protegidas a proveedores.
6. **Alpaca Trading API y Market Data** para el entorno paper; **Finnhub** como respaldo opcional de cotizaciones.
7. **localStorage** para el avance y las operaciones de la demo; **sessionStorage** para recuperar el seguimiento de una orden paper pendiente en la misma pestaña.
8. **Node Test Runner** para las pruebas automáticas, sin enviar órdenes a Alpaca.

Se recomienda **Node.js 24**. La guía utiliza npm y el archivo de bloqueo incluido; el proyecto también declara pnpm en `packageManager`.

> ### `Características implementadas`

| Funcionalidad | Qué incluye | Modalidad |
| --- | --- | --- |
| Registro | Nombre, apellido, correo, contraseña, residencia fiscal y validación de campos | Demo local |
| Verificación de correo | Código de prueba, reenvío simulado y corrección de dirección | Demo local |
| Verificación MFA | Confirmación con un segundo código de prueba | Demo local |
| Cuenta de práctica y fondeo | Identificador local, capital inicial entre 100 y 1.000.000 USD y fondos virtuales adicionales | Demo local |
| Acceso y continuidad | Acceso demostrativo, cierre de sesión y recuperación del avance en el navegador; la contraseña no se almacena | Demo local |
| Dashboard personalizado | Nombre del usuario, valor del portafolio, disponible, capital invertido y gráfico ilustrativo | Demo local |
| Mercado y operaciones | Búsqueda de activos, compras y ventas de acciones enteras, validación de fondos y posiciones | Demo local |
| Portafolio, órdenes y favoritos | Posiciones abiertas, historial de operaciones, filtros de órdenes y lista de seguimiento | Demo local |
| Cotizaciones NYSE y NASDAQ | Diez símbolos disponibles, bid/ask de Alpaca, fuente, fecha y aviso de cotización desactualizada | Alpaca Paper |
| Respaldo de cotizaciones | Último precio de Finnhub, identificado como referencia sin bid/ask | Alpaca Paper, configuración opcional |
| Órdenes al mercado | Validación de cuenta, activo, horario oficial, fondos y acciones disponibles; sin ventas en corto | Alpaca Paper |
| Seguimiento de ejecución | Órdenes aceptadas, parciales, ejecutadas, rechazadas y otros estados; recuperación por identificador y control de duplicados | Alpaca Paper |
| Sincronización y notificaciones | Actualización de saldo y posiciones, avisos de estado y notificaciones de la sesión | Alpaca Paper |
| Reportes por período | Hoy, últimos 7 días, mes actual, mes anterior, año y fechas personalizadas; agrupación diaria o mensual | Ambos orígenes, consultados por separado |
| Desglose de transacciones | Ejecuciones, cantidades, precios, importes brutos e identificadores | Ambos orígenes |
| Comisiones y cargos | Cargos, reembolsos, categorías y fecha contable del proveedor; sin estimar tarifas faltantes | Alpaca Paper; la demo no cobra comisiones |
| Exportación CSV | Resumen, transacciones o cargos de todo el período, con metadatos y protección de campos de texto | Ambos orígenes |
| Historial paginado | Carga de actividades de Alpaca por lotes y bloqueo de totales y exportaciones mientras falten páginas | Alpaca Paper |
| Experiencia de uso | Interfaz en español, menú móvil, formularios etiquetados, navegación de pestañas por teclado y avisos de estado | Toda la aplicación |

**Objetivo de respuesta para órdenes:** ≤ 5 segundos para devolver confirmación o estado pendiente. El llenado completo depende de Alpaca, el mercado y la red; no se garantiza una ejecución dentro de ese tiempo.

> ### `Estructura`

```text
soltech/
├── public/
│   └── soltech.svg       Logo provisional y favicon
├── server/               API local y conexión con Alpaca Paper
│   ├── alpaca.mjs        Cotizaciones, órdenes, cuenta y actividades
│   ├── api.mjs           Rutas y validación del origen
│   ├── env.mjs           Carga de configuración del servidor
│   └── index.mjs         Servidor de la compilación local
├── src/
│   ├── assets/           Recursos adicionales
│   ├── components/       Iconos SVG y marca
│   ├── features/
│   │   ├── paper/        Operaciones conectadas con Alpaca
│   │   └── reports/      Reportes y exportación CSV
│   ├── hooks/            Espacio para hooks compartidos
│   ├── pages/
│   │   ├── Onboarding.tsx
│   │   └── Dashboard.tsx
│   ├── services/         Mercado local, operaciones y cliente paper
│   ├── store/            Estado inicial y recuperación local
│   ├── styles/           Estilos globales, paper y reportes
│   ├── types/            Contratos de cuenta, paper y reportes
│   ├── utils/            Fechas, agregaciones e importes de reportes
│   ├── App.tsx           Estado y navegación principal
│   └── main.tsx          Arranque de React
├── tests/                Pruebas locales y proveedores controlados
├── .env.example          Plantilla sin secretos
├── .gitignore            Exclusiones del repositorio
├── package.json          Dependencias y comandos
├── package-lock.json     Versiones reproducibles con npm
├── tsconfig.json         Configuración de TypeScript
└── vite.config.ts        Vite, alias y API de desarrollo
```

El alias `@` apunta a `src`. Se utiliza CSS propio, sin frameworks de estilos ni dependencias de iconos. Las fuentes DM Sans y Manrope se solicitan a Google Fonts; existen fuentes locales de respaldo.

> ### `Puesta en marcha`

Hay dos formas de usar Soltech:

| Modo | Qué permite | Qué necesitas |
| --- | --- | --- |
| **Demostración local** | Registro, correo y MFA simulados, fondeo virtual, compras y ventas con precios de ejemplo | Node.js y las dependencias del proyecto. No requiere claves. |
| **Alpaca · Paper** | Cotizaciones de proveedores, órdenes y posiciones conectadas a una cuenta paper | Lo anterior, una cuenta Alpaca Paper y sus claves configuradas localmente |

**Para abrir la aplicación basta con instalar las dependencias y ejecutar `npm run dev`.** La configuración de Alpaca solo es necesaria para la sección conectada. Frontend y API arrancan juntos; no se necesita una segunda terminal, Docker ni una base de datos para esta versión.

#### 1. Preparar la máquina

Instala **Node.js 24 LTS**, que incluye npm, y Git si vas a clonar el repositorio. El mínimo del proyecto es Node.js 22.12. Abre una terminal nueva después de instalar Node y verifica:

```sh
node --version
npm --version
git --version
```

Ejecuta los siguientes comandos desde la raíz del proyecto, donde están `package.json`, `.env.example` y este README.

#### 2. Obtener el proyecto e instalar dependencias

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

#### 3. Arrancar la aplicación

```sh
npm run dev
```

Abre **http://127.0.0.1:5173/**. Si ese puerto está ocupado, Vite mostrará otro: utiliza la dirección que aparezca en tu terminal. Mantén esa terminal abierta. Para detener la aplicación, presiona **Ctrl + C**.

Puedes empezar de inmediato con **«Primero quiero explorar el dashboard»**, sin configurar Alpaca. Para recorrer el registro completo, usa correo de prueba, una contraseña con al menos 8 caracteres, una letra y un número, y estos códigos:

| Paso | Código de demostración |
| --- | --- |
| Verificación de correo | `123456` |
| Verificación MFA | `654321` |

#### 4. Activar Alpaca Paper

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

#### 5. Comprobar la conexión

Con el servidor de desarrollo abierto, visita:

```text
http://127.0.0.1:5173/api/paper/status
```

Si Vite eligió otro puerto, cámbialo también en esta dirección. Con ambas claves presentes, la respuesta será similar a:

```json
{"configured":true,"feed":"iex","mode":"paper"}
```

`configured: true` confirma que el servidor encontró ambas claves; **no comprueba que sean válidas ni que Alpaca esté disponible**. Para verificar esas condiciones, abre **Alpaca · Paper** y comprueba que se carguen los datos de la cuenta. Con `configured: false`, revisa que `.env` esté en la raíz, que ambos valores estén completos y que hayas reiniciado Vite.

#### 6. Probar una compra conectada

1. Abre **Alpaca · Paper** y comprueba que tu cuenta tenga saldo virtual y que el mercado esté abierto.
2. Selecciona **AAPL** (NASDAQ) o **JNJ** (NYSE) y pulsa **Actualizar precio**.
3. Elige **Comprar** e ingresa una cantidad entera de acciones.
4. Comprueba el importe estimado y el margen de validación del 3 %; pulsa **Comprar … en paper**.
5. Observa el estado de la orden. **Aceptada** significa que Alpaca la recibió; **Ejecutada** confirma su llenado completo.
6. Revisa la posición en **Mi portafolio · Alpaca**, la orden y la notificación de la sesión. Contrasta los datos con tu panel de Alpaca.

La sesión regular es de **9:30 a 16:00, hora de Nueva York**, sujeta al calendario del mercado. La aplicación consulta el reloj de Alpaca para aplicar festivos, cierres especiales y horario de verano. Durante fines de semana o con el mercado cerrado, es correcto que no permita enviar la orden.

> ### `Flujo de registro y demostración`

1. **Registro:** nombre, apellido, correo, contraseña y residencia fiscal. La contraseña requiere 8 caracteres, una letra y un número; nunca se almacena.
2. **Correo:** ingresa **123456**. Puedes simular el reenvío o corregir tu dirección.
3. **MFA:** ingresa **654321** para simular la validación del segundo factor.
4. **Cuenta Alpaca:** acepta el uso de fondos ficticios y crea una cuenta de práctica local.
5. **Fondeo:** elige entre 100 y 1.000.000 USD virtuales.
6. **Dashboard:** consulta el resumen, explora activos, compra y vende acciones enteras, revisa órdenes y administra favoritos. Puedes agregar más fondos virtuales.

El botón «Primero quiero explorar el dashboard» abre una cuenta de ejemplo con 100.000 USD. El avance, el perfil y las operaciones se conservan en `localStorage` bajo `soltech.account`. «Cerrar sesión» vuelve al acceso de demostración, conservando los datos del navegador. Este acceso no autentica identidades ni comprueba contraseñas; permite retomar la demostración local.

> ### `NYSE y NASDAQ con Alpaca Paper`

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

#### Validaciones y confirmaciones

- El backend valida el símbolo, bolsa, estado negociable, cuenta activa, reloj oficial y cantidad entera. Solo admite compras y ventas de posiciones propias, sin ventas en corto.
- Antes de comprar, exige una cotización de hasta 90 segundos y comprueba el menor valor entre efectivo y poder de compra, incluyendo un margen del 3 %. Alpaca realiza la validación definitiva; este margen no limita el precio de una orden de mercado.
- Solo se llama a `https://paper-api.alpaca.markets`. No existe un modo para enviar órdenes a cuentas con dinero real.
- Se busca responder dentro de cinco segundos con ejecución confirmada o estado pendiente. **No se garantiza una ejecución en cinco segundos**: depende del mercado, la red y Alpaca. El servidor limita comprobaciones y consultas para intentar devolver un estado en unos 4,8 segundos; una interrupción externa puede superar el objetivo de extremo a extremo.
- Se distinguen las órdenes recibidas, aceptadas, ejecutadas parcialmente, ejecutadas, rechazadas, canceladas y expiradas. Solo `filled` significa ejecución completa.
- Cada intento conserva un `client_order_id`. Los duplicados concurrentes se agrupan; un timeout ambiguo no provoca un reenvío automático. El identificador pendiente se conserva en `sessionStorage` para retomar el seguimiento al recargar la misma pestaña. Si Alpaca no confirma su recepción, consulta ese identificador en Alpaca antes de volver a operar; la interfaz bloquea nuevas órdenes mientras haya incertidumbre.
- El cliente consulta órdenes pendientes cada dos segundos, actualiza posiciones y cuenta al detectar cambios y muestra notificaciones. La cuenta se sincroniza también cada 15 segundos y la cotización seleccionada cada 20 segundos. Si una actualización falla, se informa que los valores anteriores pueden estar desactualizados.
- Los precios de respaldo se identifican como último precio; nunca se presentan como bid/ask. Los precios de ejecución provienen de Alpaca, no del precio mostrado antes de operar.

#### API y archivos

| Ruta | Función |
| --- | --- |
| `GET /api/paper/status` | Configuración disponible, sin exponer claves |
| `GET /api/paper/quote?symbol=AAPL` | Cotización con fuente y fecha |
| `GET /api/paper/snapshot` | Cuenta, posiciones, últimas 100 órdenes y reloj |
| `GET /api/paper/activities?pageToken=…` | Historial paginado de ejecuciones y cargos para reportes |
| `POST /api/paper/orders` | Orden de mercado validada con identificador único |
| `GET /api/paper/order?clientOrderId=…` | Seguimiento y recuperación de una orden |

El servidor está en `server/`, la interfaz conectada en `src/features/paper/`, el cliente API en `src/services/paper.ts` y los contratos en `src/types/paper.ts`.

Esta integración es **local, de una sola cuenta paper**. Los secretos se cargan desde `.env` en Node, nunca se envían al navegador ni se almacenan en `localStorage`. La API restringe el host a localhost/127.0.0.1 y exige solicitudes del mismo origen. El acceso del onboarding sigue siendo demostrativo: no es autenticación real del backend. No expongas este servidor a Internet ni lo despliegues para varios usuarios sin agregar autenticación de servidor, autorización por cuenta, protección de secretos y límites de uso.

#### Comprobación

`npm test` verifica la contabilidad local y la integración mediante respuestas controladas de proveedores: ambos mercados, fondos insuficientes, sesión cerrada, cuenta restringida, cotizaciones viejas, ventas sin posiciones, duplicados, timeouts, ejecuciones parciales, respaldo y protección del origen. Estas pruebas no envían órdenes a Alpaca y no certifican la latencia de una conexión real.

La prueba de aceptación conectada requiere claves paper, saldo y mercado abierto: consultar AAPL o JNJ, enviar una compra, comprobar `filled`, contrastar cantidad/precio con Alpaca, verificar portafolio actualizado y notificación. En un fin de semana o festivo, el resultado esperado es mercado cerrado y ausencia de envío.

Referencias: [órdenes de Alpaca](https://docs.alpaca.markets/us/docs/orders-at-alpaca), [paper trading](https://docs.alpaca.markets/us/docs/paper-trading), [cotizaciones y feeds](https://docs.alpaca.markets/us/reference/stocklatestquotesingle-1), [identificadores de órdenes](https://docs.alpaca.markets/us/reference/getorderbyclientorderid), [Finnhub Quote](https://finnhub.io/docs/api/quote).

> ### `Reportes de transacciones y comisiones`

Abre **Reportes** en el menú lateral del dashboard. En teléfonos, abre primero el menú superior.

1. Selecciona el origen: **Demostración local** o **Alpaca Paper**. La opción paper requiere las claves del `.env` explicadas anteriormente.
2. Elige **Hoy**, **Últimos 7 días**, **Este mes**, **Mes anterior**, **Este año** o un intervalo **Personalizado**. Las fechas inicial y final se incluyen completas.
3. Selecciona agrupación por **Día** o **Mes**.
4. Consulta las pestañas **Resumen por período**, **Transacciones** y **Comisiones y cargos**.
5. Pulsa **Descargar CSV** en la pestaña que quieras exportar. El archivo contiene todos los registros filtrados del período, aunque la tabla muestre solo 15 por página.

El resumen muestra cantidad de ejecuciones, volumen operado, compras, ventas, cargos, reembolsos, cargos netos y flujo neto. El flujo se calcula como **ventas − compras − cargos + reembolsos**; no representa rentabilidad ni saldo de cuenta. Se excluyen fondeos, retiros, dividendos e intereses.

#### Origen y fechas de los datos

- **Demostración local:** usa exclusivamente las compras y ventas guardadas en este navegador. El simulador no cobra comisiones; no se inventan tarifas para el reporte.
- **Alpaca Paper:** consulta el historial de actividades de la cuenta, incluyendo ejecuciones realizadas fuera de Soltech. Cada llenado parcial se muestra por separado usando su cantidad ejecutada, sin sumar de nuevo la cantidad acumulada de la orden.
- Las fechas de las ejecuciones se interpretan en **America/Bogota**. Los cargos usan la **fecha contable proporcionada por Alpaca**, que puede ser posterior a la compra o venta. No se les asigna una fecha de operación por aproximación.
- Se incluyen actividades **FILL**, **FEE**, **DIVFEE**, **PTC** y **PTR**. Solo se reportan importes en **USD**; las actividades que indiquen otra moneda se excluyen con un aviso, sin convertirlas.
- Los cargos se desglosan por tipo y descripción del proveedor. Los importes negativos de `net_amount` son cargos; los positivos son reembolsos o ajustes a favor. Si Alpaca no informa una orden asociada, se muestra **No informada**.
- Que Alpaca no devuelva cargos no garantiza que no existan: pueden publicarse después. No se estiman comisiones faltantes ni se presentan tarifas de cero como confirmación del proveedor.

#### Historial completo y exportación

El reporte conectado utiliza `/api/paper/activities`, con páginas de hasta 100 actividades y cursores del proveedor. Consulta el historial completo antes de filtrar por período, porque los cargos pueden crearse en una fecha distinta de la fecha contable. No se limita a las últimas 100 órdenes del dashboard.

Se cargan hasta 1.000 actividades por lote. Si quedan más, pulsa **Continuar carga** hasta ver **Historial cargado**. Ante un error, utiliza **Reintentar carga**; para consultar movimientos nuevos, pulsa **Actualizar historial**. Los totales y las exportaciones permanecen deshabilitados mientras el historial esté parcial o haya errores.

El CSV usa encabezados en español, separador `;`, codificación UTF-8 con BOM y hasta seis decimales para importes monetarios. Incluye origen, fechas del período, moneda, zona horaria e identificadores. Los campos de texto se protegen para evitar interpretar descripciones como fórmulas al abrirlas en una hoja de cálculo. Los cálculos monetarios utilizan enteros en millonésimas de USD; se redondea cada importe a esa precisión.

Para comprobarlo sin credenciales, realiza compras y ventas en la demostración local, abre **Reportes**, selecciona un período que las incluya y descarga cada pestaña. `npm test` cubre límites de fechas, ejecuciones parciales, cargos posteriores, reembolsos, cálculos decimales, cursores y exportación de más registros que una página de la tabla. La verificación contra una cuenta Alpaca requiere tus claves paper.

Referencia del proveedor: [historial de actividades y paginación de Alpaca](https://docs.alpaca.markets/us/reference/getaccountactivities-2) y [tipos de ejecuciones y cargos](https://docs.alpaca.markets/us/docs/account-activities).

> ### `Comandos disponibles`

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

> ### `Pruebas y validación`

Desde la raíz del proyecto:

```sh
npm test
npm run build
```

| Archivo | Cobertura |
| --- | --- |
| `tests/trading.test.mjs` | Compras, ventas, conservación del capital, precisión monetaria y límites del fondeo local |
| `tests/alpaca.test.mjs` | Símbolos, fondos, reloj, restricciones de cuenta, duplicados, timeouts, ejecuciones parciales, respaldo y protección de origen |
| `tests/reports.test.mjs` | Fechas de Bogotá, períodos, cargos y reembolsos, importes decimales, paginación, registros duplicados y exportación CSV |

La suite actual contiene **29 pruebas**. Las pruebas de proveedores utilizan respuestas controladas: no consumen fondos ni envían órdenes a Alpaca. La compilación comprueba TypeScript y genera `dist/`.

La comprobación conectada necesita claves paper válidas y saldo. Para enviar una orden también se requiere mercado abierto. El objetivo de latencia se debe medir con esa conexión; las pruebas controladas no lo certifican.

> ### `Archivos y protección del repositorio`

El `.gitignore` excluye los archivos propios de cada máquina y los resultados generados:

| Categoría | Ejemplos excluidos |
| --- | --- |
| Dependencias y cachés | `node_modules/`, almacenes de npm/pnpm/Yarn y cachés de herramientas |
| Compilación y cobertura | `dist/`, `build/`, `coverage/` y `*.tsbuildinfo` |
| Secretos | `.env`, variables locales, carpetas de secretos, credenciales y claves privadas |
| Archivos locales | Logs, temporales, respaldos y perfiles de diagnóstico |
| Editores y sistema operativo | `.idea/`, ajustes personales de VS Code, `.DS_Store` y `Thumbs.db` |
| Pruebas y exportaciones | Resultados de navegador, `exports/` y `artifacts/` |
| Herramientas de despliegue | Estado local de Vercel, Netlify y Wrangler |

Se conservan el **código fuente**, las **pruebas**, **`package-lock.json`**, **`.env.example`**, recursos del proyecto y documentación. Cada compañero crea su propio `.env`; las claves no se comparten ni se suben a GitHub.

Si un archivo ya estaba versionado, agregarlo al `.gitignore` no lo retira del historial. Revisa los cambios antes de subirlos y utiliza siempre plantillas sin secretos para la configuración compartida.

> ### `Solución de problemas`

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

> ### `Alcance y pendientes`

El registro no envía correos, no configura MFA real ni crea cuentas en Alpaca. En las secciones locales los precios siguen siendo fijos e ilustrativos; el gráfico mantiene el valor actual y el selector de período cambia el eje, sin representar un historial real. El fondeo local no modifica el saldo en Alpaca: ese saldo se administra desde la cuenta paper del proveedor.

El backend local básico ya existe como apoyo a la simulación y a la conexión con Alpaca Paper. La autenticación, correo, MFA, creación de cuentas y fondeo reales requieren ampliar ese backend con sesiones, autorización y persistencia segura. Las claves secretas nunca deben ponerse en variables `VITE_*`, código del cliente ni `localStorage`.

Los textos de términos y privacidad muestran información contextual de la demostración; deben reemplazarse por documentos legales definitivos antes de un lanzamiento real.

<div align="center">

**Team3DS** · Soltech · 2026

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:7aa2f7,100:bb9af7&height=120&section=footer" width="100%" alt=""/>

</div>
