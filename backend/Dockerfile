FROM eclipse-temurin:21-jre-alpine

RUN apk add --no-cache curl

WORKDIR /app
COPY build/libs/mdnote-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8089

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=180s \
  CMD curl -fsS http://localhost:8089/actuator/health/liveness || exit 1

ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
