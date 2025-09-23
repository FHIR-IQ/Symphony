# CORS-enabled FHIR Proxy for Railway
FROM node:18-alpine

WORKDIR /app

# Create package.json for FHIR proxy
RUN echo '{\
  "name": "symphony-fhir-proxy",\
  "version": "1.0.0",\
  "dependencies": {\
    "express": "^4.18.2",\
    "cors": "^2.8.5",\
    "http-proxy-middleware": "^2.0.6"\
  }\
}' > package.json

# Install dependencies
RUN npm install

# Create CORS-enabled FHIR proxy server
RUN echo 'const express = require("express");\
const cors = require("cors");\
const { createProxyMiddleware } = require("http-proxy-middleware");\
\
const app = express();\
const PORT = process.env.PORT || 8080;\
\
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization", "Accept"] }));\
\
app.get("/health", (req, res) => res.json({ status: "healthy", service: "Symphony FHIR Proxy" }));\
app.get("/fhir/metadata", async (req, res) => {\
  try {\
    const fetch = (await import("node-fetch")).default;\
    const response = await fetch("https://hapi.fhir.org/baseR4/metadata");\
    const data = await response.text();\
    res.set("Content-Type", "application/fhir+json").send(data);\
  } catch (e) { res.status(500).json({ error: e.message }); }\
});\
\
const proxy = createProxyMiddleware({\
  target: "https://hapi.fhir.org",\
  changeOrigin: true,\
  pathRewrite: { "^/fhir": "/baseR4" }\
});\
\
app.use("/fhir", proxy);\
app.listen(PORT, () => console.log(`FHIR Proxy on port ${PORT}`));' > server.js

RUN npm install node-fetch

EXPOSE 8080

CMD ["node", "server.js"]