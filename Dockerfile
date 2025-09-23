# HAPI FHIR Server - Railway Deployment from Root
FROM hapiproject/hapi:v7.0.0

# Copy custom configuration from hapi-server subdirectory
COPY hapi-server/application.yaml /data/hapi/application.yaml

# Set environment variables
ENV SPRING_CONFIG_LOCATION=file:/data/hapi/application.yaml
ENV SERVER_PORT=8080
ENV hapi.fhir.fhir_version=R4

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/fhir/metadata || exit 1