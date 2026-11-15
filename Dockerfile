# 1) Compila el frontend Angular. Su salida va a src/main/resources/static (ver frontend/angular.json).
FROM node:24-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npx ng build

# 2) Empaqueta Spring Boot con el frontend ya compilado dentro del JAR.
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /build
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN sed -i 's/\r$//' mvnw
COPY src/ src/
COPY --from=frontend /app/src/main/resources/static/ src/main/resources/static/
RUN sh ./mvnw -B -ntp -DskipTests package

# 3) Imagen final: solo el JRE y el JAR.
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /build/target/cafeteria-backend-0.0.1-SNAPSHOT.jar app.jar
ENV SPRING_PROFILES_ACTIVE=supabase,render
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=60.0 -XX:+ExitOnOutOfMemoryError"
USER 10001:10001
EXPOSE 10000
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
