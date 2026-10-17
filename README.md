# Soltech ☀

Aplicación de inversión simulada, completamente en español, desarrollada con React, TypeScript y Vite. Identidad visual en verde profundo y lima, logo de sol en SVG y diseño adaptable a teléfonos, tabletas y escritorio.

## Iniciar el proyecto

Requiere Node.js 22.12 o superior (recomendado: Node 24).

```sh
npm install
npm run dev
```

Alternativamente, con el gestor declarado en el proyecto:

```sh
corepack pnpm install
corepack pnpm dev
```

```sh
npm test         # Verifica compras, ventas, saldos y fondeo
npm run build    # Comprueba TypeScript y genera dist/
npm run preview  # Sirve la compilación de producción
```

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
src/
├── assets/              Recursos adicionales
├── components/Icon.tsx  Iconos SVG y marca
├── features/            Reservado para módulos de negocio
├── hooks/               Reservado para hooks compartidos
├── pages/
│   ├── Onboarding.tsx   Registro, correo, MFA, cuenta y fondeo
│   └── Dashboard.tsx    Resumen, portafolio, mercado, órdenes y favoritos
├── services/market.ts   Activos y precios de demostración
├── store/account.ts    Estado inicial y recuperación local
├── styles/global.css   Diseño y puntos de adaptación
├── types/index.ts      Tipos de dominio
├── utils/              Reservado para utilidades
├── App.tsx             Estado y navegación principal
└── main.tsx            Arranque de React
```

El alias `@` apunta a `src`. Se utiliza CSS propio, sin frameworks de estilos ni dependencias de iconos. Las fuentes DM Sans y Manrope se solicitan a Google Fonts; existen fuentes locales de respaldo.

## Alcance e integración posterior

Esta entrega es un frontend funcional de demostración. No envía correos, no configura MFA real, no crea cuentas en Alpaca ni ejecuta órdenes externas. Los precios son fijos e ilustrativos; por ello, el gráfico mantiene el valor actual y no inventa rendimientos. El selector de período cambia el eje de tiempo, sin representar una serie histórica real.

Para conectar servicios reales, se necesita un backend con autenticación, verificación de correo, MFA, sesiones y persistencia segura. La creación de cuentas, fondeos y órdenes de Alpaca deben realizarse desde ese servidor. Las claves secretas nunca deben ponerse en variables `VITE_*`, código del cliente ni `localStorage`.

Los textos de términos y privacidad muestran información contextual de la demostración; deben reemplazarse por documentos legales definitivos antes de un lanzamiento real.
