# Gestor de librería (frontend)

Este proyecto utiliza variables de entorno para configuración, que permiten ejecutar la app en distintos entornos (desarrollo, producción, etc.).

Archivos `.env`:

- Todos los archivos `.env` están git ignorados:
  - .env.development
  - .env.production
  - .env.local
- Sólo se encuentra commiteado `.env.example`, que contiene los valores por defecto o placeholders.

Cómo empezar a desarrollar en local:

1. Copiar el archivo de ejemplo a .env.development:
   "cp .env.example .env.development"

2. Opcional: agregar valores secretos o personalizados en .env.local (este archivo no se debe commitear).

3. Instalar dependencias e iniciar la app:
   "npm install"
   "npm run dev"

Vite cargará automáticamente .env.development y sobrescribirá valores con .env.local si existe.

Buenas prácticas:

- Nunca commitees tu .env.development real con secretos.
- .env.example sirve como referencia y plantilla para todos los desarrolladores.
- Si agregas nuevas variables de entorno, actualiza .env.example para que todos sepan que deben agregarlas.
