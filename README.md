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

## Verificación

```bash
npm test
npm run build
npm run preview
```

Las pruebas comprueban los cálculos locales, los filtros de fechas y las exportaciones. La compilación genera el sitio estático en `dist/`.

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
