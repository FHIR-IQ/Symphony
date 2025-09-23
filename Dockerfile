# HAPI FHIR Server - Railway Deployment
FROM hapiproject/hapi:latest

# Set environment variables for basic configuration
ENV hapi.fhir.fhir_version=R4
ENV hapi.fhir.cors.enabled=true
ENV hapi.fhir.cors.allowed_origin=*
ENV hapi.fhir.allow_external_references=true
ENV hapi.fhir.allow_contains_searches=true
ENV hapi.fhir.allow_multiple_delete=true
ENV hapi.fhir.server_address=http://localhost:8080/fhir
ENV spring.datasource.url=jdbc:h2:mem:test_mem
ENV spring.jpa.properties.hibernate.search.enabled=false
ENV server.port=8080

# Expose port
EXPOSE 8080