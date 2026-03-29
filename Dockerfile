# Stage 1: build the frontend
FROM node:20-alpine AS frontend-build
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Empty VITE_API_URL → API calls use relative URLs (same origin as backend)
RUN VITE_API_URL="" npm run build

# Stage 2: production image
FROM node:20-alpine
WORKDIR /app

# Backend deps (prod only)
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Backend source + migration files
COPY backend/ ./backend/
COPY db/ ./db/

# Frontend static build
COPY --from=frontend-build /build/frontend/dist ./frontend-dist

EXPOSE 3000
CMD ["node", "backend/src/index.js"]
