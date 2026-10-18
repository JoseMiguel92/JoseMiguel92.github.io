# AGENTS.md — Portfolio personal JoseMiguel92

Web estática para mostrar mi portfolio personal.

## Stack y estructura

- HTML, CSS y JavaScript puros: sin frameworks, librerías, npm, bundler ni build.
- `index.html` (estructura), `styles.css` (estilos), `app.js` (lógica y datos).
- Debe funcionar abriendo `index.html` con doble clic (`file://`): nada de módulos ES
(`type="module"`), `fetch` a archivos locales ni nada que requiera servidor.

## Convenciones

- Textos de la interfaz en español.
- Código simple, nombres descriptivos y comentarios solo donde aporten en inglés.
- Diseño limpio y responsive; cualquier pantalla nueva debe verse bien en el móvil.
- Si el proyecto no tiene inicializado el repositorio git, pregunta si se quiere inicializar.
- Los commits deben seguir el estándar conventional-commits.
- Antes de hacer commit, genera el mensaje y pregunta si está bien y si hacer el commit.

## Reglas

- Lee `docs/constitution.md` y la spec activa (`specs/NN-*/`) antes de tocar código.

## Datos

- El origen de los datos son en formato markdown, dentro de la carpeta cv-data.

## Forma de trabajar

- Antes de planificar una spec, crea una rama de git con el código de la spec activa y trabaja en ella.
- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.

## Límites

- Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- Nunca: añadir dependencias, frameworks o un paso de build.
- Siempre: actualizar `MEMORY.md` al terminar cada tarea.

## Memoria

- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones
tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su
porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de
dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).
- No añadas en la memoria ningún dato que esté en cv-data, si es necesario pregunta antes.

## Verificación

- No hay tests automáticos. Después de cada cambio, verifica con el MCP de Chrome
DevTools: abre `index.html`, prueba la funcionalidad, revisa la consola y comprueba la
vista móvil.

## Comandos

- Tests: `node --test`
