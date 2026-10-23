FROM python:3.13-alpine
ARG APP_VERSION=0.1.1
LABEL org.opencontainers.image.title="Rollenpreis" \
      org.opencontainers.image.source="https://github.com/forke24x7/rollenpreis" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.description="Mobiler Preisvergleich für Klo- und Küchenrollen"
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 HOST=0.0.0.0 PORT=8080
WORKDIR /app
COPY server.py ./
COPY static ./static
USER 65534:65534
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/healthz', timeout=3)"
CMD ["python", "server.py"]
