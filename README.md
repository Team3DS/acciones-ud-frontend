# Acciones UD · Frontend

<img src="public/acciones-ud.svg" width="80" alt="Acciones UD, propuesta 2" />

Interfaz de demostración de Acciones UD, desarrollada por Team3DS con React, TypeScript y Vite. Usa la identidad carbón, marfil y dorado, con el logo de la propuesta 2 adaptado a SVG.

Este repositorio contiene únicamente el **frontend**. No incluye backend, API, claves ni conexiones a proveedores financieros. Los precios son ilustrativos y las compras, ventas y fondeos son simulaciones locales en el navegador.

## Requisitos

- Node.js 22.18 o superior.
- npm, incluido con Node.js.

## Instalación y desarrollo

```bash
npm ci
npm run dev
```

Abre la dirección que Vite muestra en la terminal. `npm start` también inicia el entorno de desarrollo. No necesitas un archivo `.env` ni credenciales.

## Recorrido de demostración

- Desde el registro, usa **Explorar el prototipo sin autenticarme** para entrar directamente.
- También puedes recorrer el registro con datos de ejemplo. El correo usa el código `123456` y la verificación de seguridad usa `654321`; no se envían mensajes ni se crea una identidad real.
- Explora resumen, mercado, portafolio, órdenes, favoritos, fondos, protección, Premium, perfil, ayuda y reportes.
- Las operaciones de práctica modifican solo el saldo virtual y el historial local.
- Las órdenes de protección y los planes Premium son vistas previas; no envían órdenes ni realizan cobros.
- Los reportes permiten filtrar fechas, agrupar resultados y descargar CSV desde el navegador. La comisión del 2 % es una estimación visual, sin descuento de saldo.

La cuenta de demostración se conserva en `localStorage` bajo la clave `soltech.account`, por compatibilidad con el prototipo anterior. Las contraseñas no se guardan. Usa datos de ejemplo en los formularios.

## Apariencia

El selector **Claro / Oscuro / Sistema** está disponible en el registro, la barra del panel y las preferencias del perfil. La selección se conserva en `acciones-ud.theme`, se sincroniza entre pestañas y se aplica antes de cargar React. Sistema sigue la apariencia del dispositivo.

El resumen incluye una cinta de cotizaciones, un gráfico de línea o velas con períodos e inspección mediante cursor o teclado, mapa de calor con filtros, distribución del portafolio y actividad local. Las series del gráfico son ilustrativas y no modifican cotizaciones ni saldos. El botón de pausa detiene las animaciones; también se respeta la preferencia de movimiento reducido del dispositivo.

La interfaz del dashboard usa textos de producto sin etiquetas de maqueta. La cinta se desplaza automáticamente con un control independiente para pausarla o reanudarla, incluso cuando el resto de la interfaz reduce el movimiento. Su desplazamiento no representa una actualización de precios ni una conexión a bolsas.

## Idioma

El selector **ES / EN** está junto al de apariencia en el registro, en la barra del panel y en las preferencias del perfil. La elección se conserva en `acciones-ud.language`, se sincroniza entre pestañas y actualiza el atributo `lang` del documento. En la primera visita se usa el idioma del navegador: inglés si el navegador está en inglés y español en cualquier otro caso.

Los textos están en `src/i18n/es.json` y `src/i18n/en.json`, con las mismas claves en ambos archivos. Los componentes los leen con `useI18n()`:

```tsx
const { t, money, percent, date } = useI18n()
t('stats.portfolioValue')            // Valor de tu portafolio · Portfolio value
t('dash.tradeDone', { side, quantity, symbol })
money(97021.85)                      // US$ 97.021,85 · $97,021.85
```

Para agregar un texto, crea la misma clave en los dos archivos. Los montos se muestran siempre en USD; solo cambia el formato de números y fechas. Los símbolos y nombres de las empresas no se traducen. Los archivos CSV conservan sus encabezados en español para mantener un formato estable.

## Verificación

```bash
npm test
npm run build
npm run preview
```

Las pruebas comprueban los cálculos locales, los filtros de fechas, las exportaciones y que ambos idiomas tengan las mismas claves y variables. La compilación genera el sitio estático en `dist/`.

## Publicación estática

En un servicio de alojamiento estático, configura:

| Opción | Valor |
| --- | --- |
| Instalación | `npm ci` |
| Compilación | `npm run build` |
| Directorio de salida | `dist` |
| Variables de entorno | Ninguna |

La base de Vite es relativa (`./`) para permitir alojar el resultado en una subcarpeta. La navegación de la interfaz no necesita rutas de servidor. Usa un servidor HTTP o el alojamiento estático para abrir la compilación.

## Contenido del repositorio

```text
public/             Logo y archivos públicos
src/components/     Componentes compartidos y selector de tema
src/features/       Reportes y pantallas de demostración
src/i18n/           Textos en español e inglés y selector de idioma
src/pages/          Registro y panel principal
src/services/       Catálogo ilustrativo y simulación en el navegador
src/store/          Estado local de la cuenta
src/styles/         Estilos responsivos y temas
src/types/          Tipos del frontend
src/utils/          Cálculos y exportación de reportes
tests/              Pruebas de utilidades locales
```

## Preparación para Git

Versiona el código, `package.json`, `package-lock.json`, las configuraciones, las pruebas y este README. El `.gitignore` excluye dependencias, compilaciones, cachés, credenciales, configuraciones personales, registros, capturas, archivos comprimidos y resultados de pruebas.

`dist/` se genera al compilar y no se sube al repositorio de código. El archivo `package-lock.json` sí se conserva para reproducir la instalación. Esta preparación no crea commits ni realiza un push automáticamente.
