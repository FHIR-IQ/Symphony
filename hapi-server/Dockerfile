# HAPI FHIR Server - Custom Deployment
FROM hapiproject/hapi:v7.0.0

# Copy custom configuration
COPY application.yaml /app/config/

# Copy custom templates and branding
COPY src/main/webapp/ /app/src/main/webapp/

# Set environment variables
ENV SPRING_CONFIG_LOCATION=classpath:/application.yaml,/app/config/application.yaml
ENV SERVER_PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/fhir/metadata || exit 1

# Start the server
ENTRYPOINT ["java", "-jar", "/app/main.jar"]