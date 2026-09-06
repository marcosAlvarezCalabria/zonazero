# Zona Zero

Sitio web responsive de Zona Zero Tattoo & Piercing, con portada, portfolio, presentación del equipo y consulta guiada por WhatsApp.

## Abrir en local

El proyecto es estático y no requiere instalación:

1. Abre `index.html` directamente en el navegador, o
2. Sirve la carpeta con cualquier servidor HTTP estático.

## Estructura

- `index.html`: página principal.
- `artista-*.html`: fichas individuales del equipo.
- `zona-zero.css`: estilos y adaptación responsive.
- `zona-zero.js`: navegación, filtros, visor, secuencia y formulario.
- `artist-sequence/`: fotogramas de la secuencia controlada por scroll.
- `tests/zona-zero.test.mjs`: comprobaciones automatizadas de estructura y recursos.

## Pruebas

```powershell
node --test tests/zona-zero.test.mjs
node --check zona-zero.js
```
