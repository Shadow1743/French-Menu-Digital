# The Fresh Cup • Menú Digital Moderno & Minimalista

Rediseño completo, moderno y minimalista para el restaurante **The Fresh Cup** (8va calle oriente #15, barrio La Parroquia, Usulután, Usulután, El Salvador), reemplazando la interfaz genérica de Bakarta por una experiencia editorial gastronómica de alto nivel.

---

## 🌟 Características Principales

1. **Diseño Editorial Gastronómico (Anti-AI Clichés)**
   - Sin degradados púrpuras chillones ni efectos recargados de IA.
   - Paleta sobria y cálida: tonos *warm linen* (#faf8f5) y carbón tostado expreso (#191817) con acentos terracota (#945738).
   - Tipografía refinada: **Playfair Display** (títulos y acentos editoriales) combinada con **Plus Jakarta Sans** (lectura nítida, precios tabulares y fichas técnicas).
   - Modo Claro y Modo Oscuro (*Dark Mode*) con persistencia en `localStorage`.

2. **Rescate y Organización de Imágenes Originales**
   - 36 archivos multimedia organizados localmente en `./images/`:
     - 34 fotografías originales en alta resolución de hamburguesas, bebidas, alitas y cafés.
     - Logotipo oficial de la marca (`logo.jpg`).
     - Imagen de portada del restaurante (`cover.jpg`).
   - Sistema de *fallback* inteligente: si una imagen local no carga, se enlaza directamente al repositorio cloud oficial.

3. **Estructura en Archivos Independientes y Limpios**
   - [`index.html`](./index.html): Maquetación semántica SEO-friendly accesible.
   - [`styles.css`](./styles.css): Sistema de diseño completo en Vanilla CSS con variables CSS y diseño adaptativo (*Mobile-First*).
   - [`app.js`](./app.js): Lógica de renderizado, búsqueda en tiempo real, selector de porciones, carrito interactivo y generación de pedidos a WhatsApp.
   - [`menu-data.js`](./menu-data.js): Catálogo completo estructurado con todas las categorías y productos con sus respectivas variantes de precios en onzas unificadas (`oz`).
   - [`menu_clean.json`](./menu_clean.json): Catálogo maestro en formato JSON para integraciones externas.

4. **Experiencia de Usuario (UX)**
   - **Navegación pegajosa (*Sticky Nav*)**: Pestañas de categorías con seguimiento de scroll automático (*ScrollSpy*).
   - **Buscador en tiempo real**: Filtrado instantáneo por nombre o ingrediente con contador de coincidencias y botón de limpieza.
   - **Selector de porciones / tamaños**: Para platillos y bebidas con más de una opción (ej. Costillas de Elote *Sencillas $4.00 / Doble $6.00*, o Limonadas *16 oz $2.00 / 20 oz $2.50*).
   - **Modal de detalle**: Permite ver la foto en tamaño completo, descripción extendida gastronómica y seleccionar raciones.
   - **Carrito interactivo ("Tu Pedido")**: Panel lateral deslizante con ajuste de cantidades, notas para cocina (ej. *"sin cebolla"*), cálculo automático del total, aviso de confirmación de disponibilidad/envío y botón directo **"Pedir por WhatsApp"** configurado para el número oficial `+503 7646 8648`.

---

## 🚀 Cómo Visualizar el Proyecto

Puedes abrir la web de dos formas:

### Opción 1: Directamente en el navegador
Haz doble clic sobre el archivo [`index.html`](./index.html) para abrirlo en cualquier navegador (Chrome, Edge, Safari, Firefox). Funciona al 100% sin dependencias externas.

### Opción 2: Mediante el servidor local
Si deseas emular un entorno de servidor web local:
```bash
node server.js
```
Luego abre tu navegador en: [http://localhost:4173](http://localhost:4173)

---

## 📁 Estructura del Proyecto

```text
The-Fresh-Cup-Menu/
├── images/             # Fotografías originales organizadas (36 imágenes .jpg)
├── index.html          # Estructura HTML moderna y semántica
├── styles.css          # Estilos CSS Vanilla minimalistas
├── app.js              # Lógica interactiva y pedidos WhatsApp
├── menu-data.js        # Catálogo de datos del menú en JavaScript
├── menu_clean.json     # Catálogo de datos en formato JSON
├── server.js           # Servidor local de desarrollo
└── README.md           # Documentación del proyecto
```

