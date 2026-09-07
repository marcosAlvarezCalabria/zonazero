# Zona Zero — Design system

## Thesis

Una pared de estudio oscura atravesada por el verde del logotipo: el trabajo ocupa el espacio, la interfaz se limita a orientar y convertir.

## Color

- `--bg`: `oklch(14.8% 0.003 286)`
- `--surface`: `oklch(19.2% 0.008 286)`
- `--fg`: `oklch(96.5% 0.004 106)`
- `--muted`: `oklch(68% 0.014 286)`
- `--border`: `oklch(29% 0.012 286)`
- `--accent`: `oklch(88% 0.29 142)`
- Estado de error: `oklch(66% 0.22 25)`
- Estado correcto: reutiliza `--accent` con fondo translúcido.

El verde aparece en una acción principal o selección activa por región, nunca como baño general.

## Typography

- Titulares: Barlow Condensed, peso 700–800, mayúsculas, tracking negativo suave.
- Cuerpo: Barlow, peso 400–600.
- Datos: JetBrains Mono o monoespaciada del sistema.
- Ancho máximo de lectura: 68 caracteres.

## Layout

- Retícula de 12 columnas en escritorio y flujo de una columna en móvil.
- Márgenes fluidos mediante `clamp(18px, 5vw, 72px)`.
- Secciones separadas por ritmo y escala, no por contenedores redondeados.
- Fotografías a sangre con recortes cercanos y pies técnicos.
- Bordes de 1 px, esquinas de 0–4 px, sin sombras decorativas.

## Components

- Navegación fija compacta con CTA a WhatsApp.
- Botón primario rectangular verde con texto carbón; secundario transparente.
- Filtros como controles segmentados y accesibles.
- Filas de artista editoriales y compactas: miniatura de 52–72 px junto al nombre, especialidad y enlace claro. Ninguna fotografía del roster se convierte en imagen protagonista o ocupa el ancho completo.
- La ficha de Adrián abre con su retrato de trabajo `mto0jvyy-adianOwner.jpg` y reúne en la galería sus seis obras `mtnzxq*`: realismo ilustrativo de fauna y mitología, principalmente en Black & Grey con color selectivo. Nunca debe mezclar las imágenes `mtnz5w*`, que pertenecen a Reque.
- La ficha de Nur abre con su retrato confirmado `mtpkht5n-microPiercingArtis.jpg` y utiliza únicamente los seis trabajos confirmados `mto06v*`: joyería dental y micropigmentación. En la portada, el mismo retrato queda contenido en la miniatura compacta de 52–72 px. El copy no atribuye técnicas ni servicios que no estén respaldados por esas imágenes o por el usuario.
- La ficha de Reque abre con `mto16aii-reque.tattoo.jpg` y reúne los siete trabajos confirmados `mto16a*`. En la portada el mismo retrato queda contenido en la miniatura de 52–72 px junto a su nombre; las imágenes de obra no aparecen a gran formato en el roster.
- La ficha de Metx abre con su retrato confirmado `mtpk42zf-metxArtisjpg.jpg` y reúne únicamente los seis trabajos confirmados `mto1gl*`. En la portada, el mismo retrato queda contenido en la miniatura compacta de 52–72 px.
- Consulta guiada con progreso, validación, retorno al paso anterior y resumen final.
- La galería usa botones nativos que abren un visor modal; los filtros anuncian la cantidad de trabajos visibles.
- Menú móvil y visor contienen el foco mientras están abiertos y lo devuelven al control de origen al cerrarse.
- Los errores del formulario se asocian al campo correspondiente, actualizan `aria-invalid` y conducen el foco a la corrección necesaria.
- Las reseñas se presentan en una sección clara vinculada desde la navegación, con testimonios aportados y acceso externo a Google; no se inventan puntuaciones, recuentos ni identidades.

## Motion

- El hero utiliza el vídeo real de las puertas como fondo: comienza automáticamente, sin sonido y una sola vez al entrar en la página, se reproduce a `1.5×` y termina en el logotipo. Si el navegador bloquea el autoplay, el primer gesto del usuario reintenta la reproducción.
- En escritorio y móvil el vídeo cubre todo el lienzo de borde a borde, centrado y con recorte proporcional para evitar bandas vacías o deformación.
- En una entrada nueva desde el inicio, los primeros 4,5 segundos muestran únicamente el vídeo del hero; después aparecen cabecera, copy y controles con una transición breve. Una URL con ancla, el scroll restaurado o `prefers-reduced-motion` omiten la espera.
- La sección de artistas comienza con una secuencia limpia de 240 fotogramas ligada al scroll: el ensamblaje ocupa `100svh`, permanece fijado desde que alcanza el viewport y se libera exactamente al llegar al fotograma final.
- Dentro del plano animado aparece una única frase editorial —«La piel recuerda lo que el tiempo no borra.»— ligada al progreso: entra tras comenzar el ensamblaje y se retira antes del fotograma final. No hay contador ni etiquetas; una única línea verde se rellena de izquierda a derecha según el progreso real.
- La secuencia se activa cerca del viewport, precarga una ventana pequeña en la dirección de avance y descarta fotogramas lejanos para limitar memoria. Si un fotograma aún no está listo, conserva el más cercano disponible.
- Los paños de ladrillo real aparecen como fondo ambiental en hero, profesionales y protocolo, con parallax vertical limitado a 38 px en escritorio y 18 px en móvil.
- Transiciones de filtro y pasos de 220–420 ms con salida exponencial.
- La cinta de especialidades realiza una sola pasada de 4,8 segundos; no mantiene movimiento ambiental indefinido.
- Si `prefers-reduced-motion` está activo, el hero muestra directamente su fotograma final y la secuencia de artistas se reduce a una imagen final estática.
- Sin JavaScript o si el canvas falla, la sección de artistas conserva una imagen accesible y el contenido completo.

## Responsive

- El hero cambia de composición partida a imagen apilada antes de 900 px.
- En escritorio, la secuencia de artistas ocupa todo el ancho y alto del viewport antes de las fichas de Adrián, Dani, Yera, Reque, Metx y Nur; Adrián aparece primero como propietario. La sección elimina anchos fijos, padding y fondos que puedan crear huecos o romper el comportamiento sticky.
- En móvil, el plano se reduce a `84svh` con 12 px de margen lateral y se centra verticalmente; escritorio conserva el viewport completo.
- La galería usa dos columnas en tablet y una composición editorial alterna en móvil.
- Navegación móvil en panel de pantalla completa con foco controlado.
- Ningún contenido depende del hover.
- Contratos verificados para 360, 390–430, 600, 768–820, 1024–1180, 1366–1536 y 1920 px, incluyendo móvil horizontal.
- Los filtros se convierten en una banda horizontal táctil antes de 600 px y el formulario apila campos y acciones sin perder funcionalidad.
- Cabecera, visor y pie respetan las áreas seguras del dispositivo mediante `env(safe-area-inset-*)`.
