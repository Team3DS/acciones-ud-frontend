# Alineación del prototipo con el alcance v0.2

Fuente: documento «Acciones UD Levantamiento Requerimientos y Alcance», borrador v0.2 del 12 de octubre de 2026, facilitado por el equipo. La marca de interfaz sigue siendo **Soltech**, por decisión de este proyecto.

## Decisiones aplicadas

- Solo NYSE y NASDAQ, diez acciones y moneda USD. La aplicación activa no ejecuta operaciones con un motor local de precios ficticios. Sin claves se puede navegar, pero los datos financieros se muestran por consultar.
- Documento, celular, nivel, mercados, sectores y opción de interés Premium en el registro.
- OTP de correo en lugar de aplicación autenticadora: vista de 6 dígitos con 5 minutos de vigencia y bloqueo de 15 minutos tras 5 fallos. Es demostración de interfaz, no autenticación segura.
- Regla de comisión de referencia del 2 %, redondeo half-up, suma en compra y resta en venta. El cálculo está implementado; el cobro, liquidación y libro de comisiones por usuario están pendientes.
- Market, Limit y DAY/GTC, revisión antes de enviar y confirmación explícita de encolamiento fuera de horario. Alpaca decide aceptación, reserva y ejecución; no se inventan llenados.
- Solicitud de cancelación de órdenes propias pendientes, filtros y detalle con las fechas conocidas del proveedor.
- Centro de notificaciones local, perfil editable, watchlist y alertas condicionadas a Premium. El checkout de Stripe y la evaluación de alertas están deshabilitados hasta integrar el servidor.
- Reporte de comisión Soltech estimada separado de los cargos efectivamente informados por Alpaca. No se presenta una estimación como una comisión cobrada.

## Convención de estado

**Parcial** no significa cumplimiento del requerimiento. **Diseño / integración pendiente** indica una pantalla o cálculo de prototipo sin la integración necesaria. **Pendiente** no está implementado. Los elementos Could y Won't conservan la prioridad del documento; no se incorporan como compromiso del MVP.

El backend es una conexión local de desarrollo con una sola cuenta paper, no un backend multiusuario del alcance. No hay autenticación real, permisos por usuario, cuentas Broker automáticas, base ACID/3FN, libro de reservas/comisiones, Stripe ni despliegue público certificados. Las pruebas controladas no verifican latencia contra Alpaca ni concurrencia de 1.500 usuarios.

## Matriz de los 106 requerimientos

| ID | Requerimiento | Prioridad documental | Estado del prototipo | Evidencia o brecha |
| --- | --- | --- | --- | --- |
| RF-01 | Registro de usuarios | MUST HAVE | Parcial | Campos de identidad, nivel e intereses añadidos. Falta alta segura, unicidad de correo y persistencia. |
| RF-02 | Inicio de sesión con autenticación multifactor (MFA) | MUST HAVE | Parcial | Maqueta OTP por correo de 6 dígitos; caducidad y bloqueo demostrados en pantalla. Falta envío, generación, uso único y control en servidor. |
| RF-03 | Código MFA por SMS | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-04 | Gestión de sesión y recuperación de contraseña | SHOULD HAVE | Pendiente | Sin implementación completa en esta entrega del prototipo. |
| RF-05 | Control de acceso por roles (RBAC) | MUST HAVE | Pendiente | No hay RBAC real; vistas de administración y directivos solo propuestas en el PDF. |
| RF-06 | Creación de cuenta de corretaje en Alpaca | MUST HAVE | Diseño / integración pendiente | Paso visual. No crea cuentas mediante Broker API ni vincula usuarios reales. |
| RF-07 | Consulta de saldo y fondos disponibles | MUST HAVE | Parcial | Saldo y poder de compra del proveedor; faltan reservas propias por usuario. |
| RF-08 | Fondeo simulado de la cuenta | MUST HAVE | Diseño / integración pendiente | Paso visual del fondeo y vista Fondos de práctica con diálogo de monto/revisión y proyección. Solo frontend: sin abono ni movimientos en Alpaca. |
| RF-09 | Reserva y liberación de fondos | MUST HAVE | Diseño / integración pendiente | Alpaca gestiona sus reservas; no existe libro interno con comisión y usuario. |
| RF-10 | Retiros bancarios y verificación de identidad (KYC/AML) reales | WON'T HAVE | Fuera de alcance | No se implementa en este ciclo. |
| RF-11 | Catálogo de mercados y acciones | MUST HAVE | Parcial | Diez símbolos, USD, mercado y sector. Volumen depende del feed; capitalización no disponible. |
| RF-12 | Horarios de operación, zona horaria y feriados | MUST HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RF-13 | Validación de la ventana de operación y encolamiento fuera de horario | MUST HAVE | Parcial | Confirmación explícita y extended_hours=false; cola y apertura delegadas a Alpaca. Falta persistir la confirmación y traza propia. |
| RF-14 | Configuración de mercados por el administrador | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-15 | Propagación de cambios de horario | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-16 | Capa de abstracción de datos de mercado | MUST HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RF-17 | Consulta de cotizaciones y detalle de acciones (Quote) | MUST HAVE | Parcial | Bid/ask, último precio, spread, variación, volumen y fuente cuando están disponibles; capitalización queda pendiente. |
| RF-18 | Dashboard inicial personalizado | MUST HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RF-19 | Búsqueda, filtrado y ordenamiento de acciones | SHOULD HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RF-20 | Gráficos históricos de precio | SHOULD HAVE | Pendiente | Sin series ficticias en la vista activa. Históricos reales pendientes. |
| RF-21 | Actualización de precios en casi tiempo real | SHOULD HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RF-22 | Estadísticas e indicadores de análisis | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-23 | Operación en bolsas internacionales (LSE, TSE y ASX) | WON'T HAVE | Fuera de alcance | No se implementa en este ciclo. |
| RF-24 | Integración con Bloomberg API | WON'T HAVE | Fuera de alcance | No se implementa en este ciclo. |
| RF-25 | Orden de mercado (compra y venta) | MUST HAVE | Parcial | Market con revisión y estimación de comisión; se muestra el precio ejecutado. Falta liquidación interna. |
| RF-26 | Orden límite (Limit) | MUST HAVE | Parcial | Limit y DAY/GTC enviados al proveedor, sin motor de ejecuciones falso. Falta libro de reservas interno. |
| RF-27 | Órdenes de protección: Stop Loss y Take Profit | SHOULD HAVE | Diseño / integración pendiente | Vista navegable Órdenes de protección: formularios Stop Loss / Take Profit y diálogo de revisión con comisión estimada. Solo frontend; activación deshabilitada, sin validar tenencia ni enviar órdenes. |
| RF-28 | Orden Trailing Stop | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-29 | Validación de reglas de compra y venta | MUST HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RF-30 | Cálculo de comisión parametrizable | MUST HAVE | Parcial | Cálculo half-up al 2 % y desglose. No se cobra ni se descuenta en Alpaca; falta configuración versionada por mercado. |
| RF-31 | Reparto de comisión plataforma | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-32 | Máquina de estados de la orden | MUST HAVE | Parcial | Estados del proveedor y fechas conocidas; falta máquina de estados propia persistente con actor y causa. |
| RF-33 | Envío y seguimiento de órdenes en Alpaca (NYSE y NASDAQ) | MUST HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RF-34 | Cancelación de órdenes pendientes | MUST HAVE | Parcial | Solicita cancelación de órdenes Soltech pendientes; espera confirmación de Alpaca. No finge liberación de reservas propias. |
| RF-35 | Historial y detalle de órdenes | MUST HAVE | Parcial | Filtros y detalle con fechas del proveedor. Lista limitada a últimas 100 órdenes; falta historial completo de eventos. |
| RF-36 | Expiración de órdenes | SHOULD HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RF-37 | Órdenes avanzadas y operaciones apalancadas | WON'T HAVE | Fuera de alcance | No se implementa en este ciclo. |
| RF-38 | Consulta de portafolio y posiciones (Holdings) | MUST HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RF-39 | Actualización automática del portafolio | MUST HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RF-40 | Preferencias de visualización del portafolio | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-41 | Otros activos y dividendos | WON'T HAVE | Fuera de alcance | No se implementa en este ciclo. |
| RF-42 | Asociación usuario–comisionista | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-43 | Panel del comisionista | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-44 | Propuesta de órdenes y aprobación del cliente | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-45 | Firma de órdenes por el comisionista | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-46 | Revisión de las órdenes del cliente antes del envío | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-47 | Órdenes a nombre del cliente (mandato) | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-48 | Motor de notificaciones por eventos | MUST HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RF-49 | Canales de notificación: correo electrónico y dentro de la aplicación | MUST HAVE | Parcial | Centro local con no leídas. Correo, persistencia de notificaciones y reintentos aún pendientes. |
| RF-50 | Notificaciones por SMS | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-51 | Notificaciones por WhatsApp | WON'T HAVE | Fuera de alcance | No se implementa en este ciclo. |
| RF-52 | Notificaciones push en dispositivos móviles | WON'T HAVE | Fuera de alcance | No se implementa en este ciclo. |
| RF-53 | Preferencias de notificación | SHOULD HAVE | Diseño / integración pendiente | Sin implementación completa en esta entrega del prototipo. |
| RF-54 | Alertas de precio por umbral | SHOULD HAVE | Diseño / integración pendiente | Sin implementación completa en esta entrega del prototipo. |
| RF-55 | Avisos de apertura y cierre de mercados | SHOULD HAVE | Pendiente | Sin implementación completa en esta entrega del prototipo. |
| RF-56 | Resumen diario de operaciones | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-57 | Gestión del perfil | SHOULD HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RF-58 | Configuración de operaciones | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-59 | Suscripción premium con Stripe | SHOULD HAVE | Diseño / integración pendiente | Planes USD 12/mes y 120/año; Checkout deshabilitado. Faltan Stripe y webhooks. |
| RF-60 | Habilitación de funcionalidades premium | SHOULD HAVE | Parcial | Watchlist y alertas requieren Premium; solo existe una vista previa de diseño, sin autorización de servidor. |
| RF-61 | Listas de observación (Watchlist) | SHOULD HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RF-62 | Gestión de la suscripción | SHOULD HAVE | Diseño / integración pendiente | Sin implementación completa en esta entrega del prototipo. |
| RF-63 | Cobros reales y facturación fiscal | WON'T HAVE | Fuera de alcance | No se implementa en este ciclo. |
| RF-64 | Reporte de transacciones y órdenes por periodo | MUST HAVE | Parcial | Ejecuciones paginadas y fechas; falta reporte íntegro de órdenes y aislamiento por usuario autenticado. |
| RF-65 | Reporte desglosado de comisiones | MUST HAVE | Parcial | Comisión estimada por ejecución, usuario de prototipo y período; no se presenta como cobrada. Cargos del proveedor separados. |
| RF-66 | Reporte de ganancias y pérdidas y resumen de activos | SHOULD HAVE | Diseño / integración pendiente | Sin implementación completa en esta entrega del prototipo. |
| RF-67 | Resumen de portafolio por cliente y por comisionista | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-68 | Reporte mensual automático | SHOULD HAVE | Diseño / integración pendiente | Sin implementación completa en esta entrega del prototipo. |
| RF-69 | Exportación de reportes a PDF y CSV | COULD HAVE | Parcial | CSV implementado; el PDF generado es documentación de mockups, no exportación financiera del producto. |
| RF-70 | Dashboard empresarial de indicadores (KPI) | SHOULD HAVE | Diseño / integración pendiente | Sin implementación completa en esta entrega del prototipo. |
| RF-71 | Gráficos de crecimiento trimestral y tendencias | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-72 | Registro de auditoría de eventos | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-73 | Trazabilidad completa de cada orden | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-74 | Módulo de auditoría con filtros | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-75 | Detección de actividad inusual y restricción de usuarios | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-76 | Informe de auditoría con comparativa de patrones | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-77 | Centralización y consulta de logs | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-78 | Alarmas operativas | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-79 | Sello de integridad de registros (no repudio) | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RF-80 | Integración con Splunk | WON'T HAVE | Fuera de alcance | No se implementa en este ciclo. |
| RF-81 | Gestión de usuarios, comisionistas y estados | SHOULD HAVE | Diseño / integración pendiente | Diseño en PDF; no administra usuarios reales. |
| RF-82 | Parametrización de comisiones desde el panel | SHOULD HAVE | Diseño / integración pendiente | Diseño en PDF; tasa usada por la interfaz sigue fija en 2 %, sin vigencias ni auditoría. |
| RNF-01 | Tiempo de respuesta | MUST HAVE | Pendiente | Sin medición de percentiles ni prueba de carga. |
| RNF-02 | Confirmación de operaciones en 5 segundos | MUST HAVE | Parcial | Presupuesto temporal y seguimiento implementados; no se certifica el SLA sin prueba conectada. |
| RNF-03 | Capacidad y concurrencia | MUST HAVE | Pendiente | Sin implementación completa en esta entrega del prototipo. |
| RNF-04 | Prueba de carga | SHOULD HAVE | Pendiente | Sin implementación completa en esta entrega del prototipo. |
| RNF-05 | Disponibilidad en horarios de mercado | SHOULD HAVE | Pendiente | Sin implementación completa en esta entrega del prototipo. |
| RNF-06 | Tolerancia a fallos de proveedores externos | SHOULD HAVE | Pendiente | Sin implementación completa en esta entrega del prototipo. |
| RNF-07 | Copias de seguridad y recuperación | SHOULD HAVE | Pendiente | Sin implementación completa en esta entrega del prototipo. |
| RNF-08 | Alta disponibilidad multi-región con conmutación automática | WON'T HAVE | Fuera de alcance | No se implementa en este ciclo. |
| RNF-09 | Cifrado y almacenamiento seguro de credenciales | MUST HAVE | Pendiente | Sin autenticación real, hash de contraseña, TLS de despliegue ni cifrado de base de datos. |
| RNF-10 | Protección frente a OWASP Top 10 | MUST HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RNF-11 | Gestión de secretos | MUST HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RNF-12 | Protección de datos personales (Ley 1581 de 2012) | SHOULD HAVE | Pendiente | Sin implementación completa en esta entrega del prototipo. |
| RNF-13 | Integridad transaccional y 3FN | MUST HAVE | Pendiente | No hay base relacional ACID/3FN; idempotencia parcial en envío de órdenes. |
| RNF-14 | Precisión monetaria | MUST HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RNF-15 | Tratamiento de tiempo y zonas horarias | MUST HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RNF-16 | Conservación del histórico | MUST HAVE | Pendiente | No existe almacén de histórico de solo adición; localStorage no cumple retención. |
| RNF-17 | Interfaz web responsiva | MUST HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RNF-18 | Facilidad de uso | SHOULD HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RNF-19 | Accesibilidad WCAG 2.1 AA | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RNF-20 | Arquitectura modular con patrones de diseño | MUST HAVE | Parcial | No se declara cumplimiento completo. Requiere implementación o verificación adicional. |
| RNF-21 | Pruebas automatizadas | SHOULD HAVE | Parcial | 38 pruebas controladas. Cobertura ≥70 % no medida. |
| RNF-22 | Análisis estático continuo (SonarQube) | COULD HAVE | Pendiente | Solo con holgura y aprobación del alcance. |
| RNF-23 | Despliegue público | MUST HAVE | Pendiente | Despliegue HTTPS y Docker pendientes. Uso local únicamente. |
| RNF-24 | Integración y despliegue continuo | SHOULD HAVE | Pendiente | Sin implementación completa en esta entrega del prototipo. |

## Ambigüedades y validaciones del cliente

- La comisión del 2 %, el alcance de dos bolsas y los módulos diferidos son propuestas del borrador sujetas a validación con el cliente.
- RF-32 enumera estados que no incluyen «Ejecutada», aunque los flujos y Alpaca sí la requieren. La interfaz mantiene la ejecución final como información explícita del proveedor; el diagrama de estados debe acordarse.
- La comisión estimada de reportes usa 2 % como referencia actual por ejecución; no es una tarifa histórica versionada por orden. No debe usarse como prueba de cobro ni aplicarse retroactivamente a fondos.
- Sin comisionista, el diseño asigna el 100 % de la comisión a Soltech. El reparto 60/40 depende de M7 y no se activa.
- M7, M12 y administración de mercados son Could Have. El PDF los distingue de las pantallas previstas para Must y Should.

## Verificación realizada

Compilación de TypeScript/Vite y 38 pruebas controladas: órdenes paper, validaciones, comisión, redondeo, Limit, confirmación de cola, cancelación, actividades, fechas y CSV. Sin credenciales no se ha realizado una aceptación conectada con Alpaca. Las pruebas de UI en navegador no se han certificado en esta sesión.
