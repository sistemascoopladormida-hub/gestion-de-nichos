# Pruebas funcionales mínimas — MVP etapa 2

Automatizado: `npm run test` (reglas de permisos).

Manuales recomendadas en entorno con BD:

| # | Caso | Resultado esperado |
|---|------|-------------------|
| 1 | Fallecido PFC + nicho vía wizard con mapa | Ocupación activa, nicho ocupado |
| 2 | No PFC + garante + préstamo | Vencimiento +6 meses, estado PRESTAMO visual |
| 3 | Asignar nicho ocupado | Error claro, sin doble ocupación |
| 4 | Dos nichos mismo fallecido | Rechazado por índice único / validación |
| 5 | Finalizar ocupación (ADMIN) | Nicho DISPONIBLE, historial con fechas y motivo |
| 6 | Préstamo vencido | Alerta PRÉSTAMO VENCIDO, nicho sigue ocupado |
| 7 | Resolución TRASLADADO | Préstamo cerrado + ocupación finalizada |
| 8 | OPERADOR → `POST .../finalizar` o `PATCH /prestamos` | HTTP 403 |
| 9 | Acción ADMIN | Registro en `/auditoria` |
| 10 | Documento | Subir → listar → descargar → eliminar (ADMIN) |
