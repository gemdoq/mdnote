FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY build/libs/mdnote-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8089
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
