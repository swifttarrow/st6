# Root Dockerfile for Railway: SPA frontend (Vite) + Spring Boot API in one image.
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ENV BUILD_SPA=1
ENV VITE_API_BASE_URL=""
RUN npm run build

FROM eclipse-temurin:21-jdk-alpine AS backend
WORKDIR /app
COPY backend/ ./
COPY --from=frontend /app/frontend/dist ./src/main/resources/static
RUN chmod +x gradlew && ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=backend /app/build/libs/*.jar app.jar
EXPOSE 8080
# Default: H2 in-memory (demo). With Railway Postgres, set variables from the DB service and use:
# SPRING_PROFILES_ACTIVE=prod,railway,docker
ENV SPRING_PROFILES_ACTIVE=docker
CMD ["java", "-jar", "app.jar"]
