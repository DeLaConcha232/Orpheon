## Orpheon Loyalty System

PWA para el sistema de lealtad Orpheon: escaneo QR, acumulación/canje de puntos, historial, perfil y más. Stack: Vite + React + TypeScript + Tailwind + shadcn-ui + Supabase.

### Requisitos
- Node.js LTS y npm

### Scripts
- dev: entorno de desarrollo
- build: build de producción
- preview: vista previa del build

### Desarrollo
```sh
npm i
npm run dev
```

### PWA
- Manifesto: `public/manifest.json`
- Service Worker: `public/sw.js`
- Iconos: `public/icon-192.png` y `public/icon-512.png`

### SEO y Social
- Edita `index.html` para título, descripción, Open Graph y Twitter Cards
- Cuando tengas dominio propio, actualiza las etiquetas `canonical`, `og:url` y `twitter:url`

### Despliegue
- Compatible con Vercel u otros hostings estáticos
- Configura variables de entorno de Supabase
