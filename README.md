# Switch 2 Price Tracker Chile — starter

## Qué incluye
- PWA responsive instalable en Android y escritorio.
- Panel, filtros por categoría, umbral de $500.000 CLP y controles de alerta.
- Sonido y aviso visual de prueba.
- Backend Node/Express + SQLite, historial de observaciones y endpoint de ofertas.
- Programador objetivo de cinco minutos en el servidor.

## Importante: estado real del proyecto
La interfaz usa datos de demostración claramente marcados. **No consulta tiendas todavía.** El backend tampoco incluye conectores de tiendas: hay que desarrollar y validar un adaptador por fuente antes de mostrar precios como reales. No se deben inventar URLs ni disponibilidad.

## Ejecutar la interfaz
Desde la carpeta `public`, cualquier servidor estático sirve los archivos. Para probar el backend:
```bash
cd server
npm install
npm start
```
API: `GET /api/health`, `GET /api/offers`, `GET /api/history?product=...`, `POST /api/observations`.

## Activar seguimiento real
1. Desplegar el backend en un servicio Node persistente con almacenamiento persistente para `prices.db`.
2. Implementar adaptadores por tienda o usar APIs/feeds oficiales y comparadores con permiso.
3. Verificar producto/variante, vendedor, condición, precio final y despacho a Chile.
4. Registrar observaciones y generar alertas al cruzar el umbral de $500.000 CLP.
5. Para notificaciones con la PWA cerrada, configurar HTTPS, Web Push, claves VAPID, suscripciones y un servicio de envío. El sonido no puede garantizarse si el navegador está cerrado; las notificaciones del sistema dependen de permisos y plataforma.

## Límites técnicos
- El cron de cinco minutos es un objetivo de ejecución del backend; hosting, suspensión del servicio, cuotas y límites de cada comercio pueden impedir exactitud.
- No hacer scraping agresivo ni eludir CAPTCHA, autenticación o controles anti-bot. Priorizar APIs, feeds, afiliación y fuentes permitidas.
- El precio anunciado no siempre incluye despacho, cupón o condiciones bancarias; guardar cada componente por separado.
- Los datos de demostración nunca deben tratarse como ofertas disponibles.
