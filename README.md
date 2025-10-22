
  # Pixel Perfect Design quin final

  This is a code bundle for Pixel Perfect Design quin final. The original project is available at https://www.figma.com/design/TjzLJg3yARDJkIOHWCKPVe/Pixel-Perfect-Design-quin-final.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  # Quiniela-Somos-locales
# Quiniela-SL-mejorada

## Flujo por jornada para la quiniela

1. **Preparar la siguiente jornada**
   - Desde el cierre de la jornada actual, clona las quinielas de cada usuario en `Usuarios/{uid}/quinielas/{nuevaJornada}`.
   - Copia sólo la estructura base (`jornada`, `pronosticos`, `estadoQuiniela: "abierta"`, `puntosObtenidos: 0`, `fechaCreacion: serverTimestamp`).
   - Conserva las quinielas anteriores en modo lectura (`estadoQuiniela: "cerrada"`). El script `scripts/migrateQuinielasIds.ts` puede ayudarte a automatizarlo.

2. **Actualizar la plantilla de UI**
   - Reutiliza la plantilla de la jornada previa y reemplaza equipos, horarios y textos con los nuevos datos.
   - La jornada pasada sigue visible pero con campos deshabilitados para consulta.

3. **Crear el documento de la jornada en Firestore**
   - Actualiza `jornadas/{nuevaJornada}` con `fechaCierre` y `resultadosOficiales: []` para disparar el cálculo de puntos al publicar resultados.

4. **Estados de las tarjetas**
   - **Próximamente**: jornada aún no abierta (`fechaInicio` futura). Estilo gris sin acciones.
   - **En curso**: jornada abierta. Si `estadoQuiniela === "abierta"` muestra **Participar**; si ya envió, cambia a **Ver**.
   - **Enviado**: jornada cerrada o pasada. Muestra estado `Enviado` y sólo permite **Ver** en modo lectura.

5. **Enviar la quiniela**
   - Valida que haya 9 pronósticos antes de permitir el envío.
   - Guarda `pronosticos` en `Usuarios/{uid}/quinielas/{jornada}`, marca `estadoQuiniela: "cerrada"` o `quinielaEnviada: true` y actualiza `fechaActualizacion`.
   - Cambia el botón de la tarjeta a **Ver** y, opcionalmente, actualiza `Usuarios/{uid}/ultimaJornada`.

6. **Resultados oficiales y puntos**
   - Al finalizar la jornada, carga `resultadosOficiales` en `jornadas/{jornada}`.
   - Ejecuta `calcularPuntosUsuario` (script o Cloud Function) para comparar pronósticos y otorgar puntos, actualizando `puntosObtenidos`, `estadoQuiniela` y el acumulado del usuario.

7. **Verificación y podio**
   - Comprueba que la UI refleje los totales en la tabla/podio y que las jornadas pasadas estén en modo lectura con colores correctos.

8. **Checklist antes de abrir jornada**
   - Ejecuta la migración de plantillas.
   - Actualiza la UI con partidos/horarios/copy.
   - Confirma la creación de `jornadas/{nuevaJornada}`.
   - Valida el flujo de envío y bloqueo.
   - Revisa reglas de Firestore para impedir sobrescrituras en quinielas cerradas.

Este flujo asegura que cada jornada se abra con la estructura correcta, permita una sola participación por usuario y conserve el histórico en modo consulta.
