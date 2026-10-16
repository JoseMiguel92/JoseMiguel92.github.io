# Constitución del portfolio personal

Reglas innegociables. Si una decisión las incumple, esa decisión está mal.

1. **Stack mínimo**: HTML, CSS y JavaScript. Sin frameworks, sin librerías, sin build. La app funciona con doble clic en `index.html`.
2. **Spec antes que código**: cada funcionalidad se escribe primero en `specs/NNN/spec.md`. O el código cumple el spec, o se actualiza el spec.
3. **Lógica separada de la interfaz**: las funciones necesarias para que la aplicación funcione van en ficheros separados, en la carpeta js y nunca tocan `document`.
4. **Tests sin instalar nada**: la lógica se prueba con `node --test`, que ya viene con Node. Cero dependencias. Los tests son opcionales: la app funciona sin ellos.
5. **Idioma**: variables, funciones, comentarios deben ir en ingles. Los textos de la interfaz y specs deben ir en castellano.

Si dos reglas chocan, manda la 1.
