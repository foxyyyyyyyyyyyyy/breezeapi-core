export const swaggerHtml = `<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
    <style>
      :root {
        --border: 215 20% 65%;
        --input: 215 20% 18%;
        --ring: 174 60% 51%;
        --background: 215 25% 16%;
        --foreground: 215 20% 85%;
        --primary: 174 60% 51%;
        --primary-foreground: 215 20% 16%;
        --secondary: 215 20% 30%;
        --secondary-foreground: 215 20% 85%;
        --destructive: 0 80% 60%;
        --destructive-foreground: 215 20% 16%;
        --muted: 215 20% 25%;
        --muted-foreground: 215 20% 65%;
        --accent: 174 60% 51%;
        --accent-foreground: 215 20% 16%;
        --popover: 215 25% 18%;
        --popover-foreground: 215 20% 85%;
        --card: 215 25% 18%;
        --card-foreground: 215 20% 85%;
        --radius: 0.5rem;
      }
      body {
        margin: 0;
        padding: 0;
        background: hsl(var(--background));
        color: hsl(var(--foreground));
        font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      }
      #swagger-ui {
        max-width: 1400px;
        margin: 2rem auto;
        padding: 2rem;
        border-radius: var(--radius);
        background: hsl(var(--card));
        box-shadow: 0 4px 32px 0 rgba(16,21,40,0.12);
      }
      /* Increase specificity and add !important to override Swagger UI styles */
      #swagger-ui .topbar {
        background: transparent !important;
        box-shadow: none !important;
        border-bottom: 1px solid hsl(var(--border)) !important;
        padding: 0 0 1rem 0 !important;
      }
      #swagger-ui .topbar-wrapper img {
        display: none !important;
      }
      #swagger-ui .info {
        background: none !important;
        border-radius: var(--radius) !important;
        color: hsl(var(--foreground)) !important;
      }
      #swagger-ui .info h1, 
      #swagger-ui .info h2, 
      #swagger-ui .info h3, 
      #swagger-ui .info h4 {
        color: hsl(var(--card-foreground)) !important;
      }
      #swagger-ui .info a {
        color: #5eead4 !important;
      }
      #swagger-ui .info a:hover {
        color: #2dd4bf !important;
      }
      #swagger-ui .opblock {
        border-radius: var(--radius) !important;
        border: 1px solid hsl(var(--border)) !important;
        background: hsl(var(--popover)) !important;
        margin-bottom: 1.5rem !important;
        overflow: hidden !important;
      }
      #swagger-ui .opblock .opblock-summary {
        border-radius: var(--radius) var(--radius) 0 0 !important;
        background: hsl(var(--muted)) !important;
        color: hsl(var(--muted-foreground)) !important;
        border-bottom: 1px solid hsl(var(--border)) !important;
      }
      #swagger-ui .opblock.is-open {
        box-shadow: 0 2px 16px 0 rgba(16,21,40,0.10) !important;
        border-radius: var(--radius) !important;
        border: 1px solid hsl(var(--primary)) !important;
        background: hsl(var(--popover)) !important;
      }
      #swagger-ui .opblock .opblock-summary-method {
        border-radius: var(--radius) 0 0 var(--radius) !important;
        background: hsl(var(--primary)) !important;
        color: hsl(var(--primary-foreground)) !important;
      }
      #swagger-ui .opblock .opblock-summary-description {
        color: hsl(var(--foreground)) !important;
      }
      #swagger-ui .opblock .opblock-section-header {
        color: hsl(var(--foreground)) !important;
        background: hsl(var(--popover)) !important;
        border-radius: 0 0 var(--radius) var(--radius) !important;
        border-bottom: 1px solid hsl(var(--border)) !important;
      }
      #swagger-ui .opblock .opblock-section-header label {
        color: hsl(var(--foreground)) !important;
      }
      #swagger-ui .opblock .opblock-body {
        background: hsl(var(--popover)) !important;
        border-radius: 0 0 var(--radius) var(--radius) !important;
        border-top: none !important;
        padding-bottom: 1rem !important;
      }
      #swagger-ui .opblock .opblock-body pre {
        background: #1e293b !important;
        color: #5eead4 !important;
        border-radius: 0.25rem !important;
        padding: 0.5rem !important;
      }
      #swagger-ui .opblock .opblock-body code {
        background: #1e293b !important;
        color: #5eead4 !important;
        border-radius: 0.25rem !important;
        padding: 0.25rem 0.5rem !important;
      }
      #swagger-ui .btn {
        background: hsl(var(--primary)) !important;
        color: hsl(var(--primary-foreground)) !important;
        border-radius: var(--radius) !important;
        border: none !important;
        padding: 0.5rem 1.25rem !important;
        font-weight: 500 !important;
        transition: background 0.2s !important;
      }
      #swagger-ui .btn:hover, #swagger-ui .btn:focus {
        background: #2dd4bf !important;
        color: #1e293b !important;
      }
      #swagger-ui .parameters-col_description, 
      #swagger-ui .response-col_description {
        color: hsl(var(--foreground)) !important;
        font-size: 1rem !important;
      }
      #swagger-ui .parameter__name, 
      #swagger-ui .response-col_status {
        color: hsl(var(--primary)) !important;
        font-weight: 600 !important;
      }
      #swagger-ui .tab li {
        border-radius: var(--radius) var(--radius) 0 0 !important;
        background: hsl(var(--muted)) !important;
        color: hsl(var(--muted-foreground)) !important;
      }
      #swagger-ui .tab li.active {
        background: hsl(var(--primary)) !important;
        color: hsl(var(--primary-foreground)) !important;
      }
      #swagger-ui .model-title {
        color: hsl(var(--accent)) !important;
      }
      #swagger-ui .model-box {
        background: hsl(var(--popover)) !important;
        border-radius: var(--radius) !important;
        border: 1px solid hsl(var(--border)) !important;
      }
      #swagger-ui .prop-type {
        color: #5eead4 !important;
      }
      #swagger-ui .markdown code {
        background: #1e293b !important;
        color: #5eead4 !important;
        border-radius: 0.25rem !important;
        padding: 0.25rem !important;
      }
      #swagger-ui .markdown h1,
      #swagger-ui .markdown h2,
      #swagger-ui .markdown h3,
      #swagger-ui .markdown h4 {
        color: #f8fafc !important;
      }
      #swagger-ui .markdown a {
        color: #5eead4 !important;
      }
      #swagger-ui .markdown a:hover {
        color: #2dd4bf !important;
      }
      /* Scrollbar styling */
      ::-webkit-scrollbar {
        width: 8px;
        background: hsl(var(--muted)) !important;
      }
      ::-webkit-scrollbar-thumb {
        background: hsl(var(--primary)) !important;
        border-radius: 4px !important;
      }
      /* Improve text readability */
      #swagger-ui,
      #swagger-ui .info,
      #swagger-ui .opblock,
      #swagger-ui .opblock .opblock-summary,
      #swagger-ui .opblock .opblock-section-header,
      #swagger-ui .opblock .opblock-body,
      #swagger-ui .parameters-col_description,
      #swagger-ui .response-col_description,
      #swagger-ui .parameter__name,
      #swagger-ui .response-col_status,
      #swagger-ui .tab li,
      #swagger-ui .tab li.active,
      #swagger-ui .model-title,
      #swagger-ui .model-box,
      #swagger-ui .markdown,
      #swagger-ui .markdown h1,
      #swagger-ui .markdown h2,
      #swagger-ui .markdown h3,
      #swagger-ui .markdown h4,
      #swagger-ui .markdown code {
        color: #f8fafc !important; /* much lighter for dark backgrounds */
        font-weight: 500 !important;
        letter-spacing: 0.01em;
      }
      #swagger-ui .info h1, 
      #swagger-ui .info h2, 
      #swagger-ui .info h3, 
      #swagger-ui .info h4 {
        color: #f8fafc !important;
        font-weight: 700 !important;
      }

      /* Fix filter input and icon */
      #swagger-ui .filter-container {
        position: relative !important;
        margin-bottom: 1.5rem !important;
      }
      #swagger-ui .filter-container input {
        background: hsl(var(--input)) !important;
        color: #f8fafc !important;
        border: 1px solid hsl(var(--border)) !important;
        border-radius: var(--radius) !important;
        padding: 0.5rem 1rem 0.5rem 2.5rem !important; /* left padding for icon */
        font-size: 1rem !important;
        outline: none !important;
        transition: border 0.2s;
        box-shadow: none !important;
      }
      #swagger-ui .filter-container input:focus {
        border-color: hsl(var(--primary)) !important;
      }
      #swagger-ui .filter-container::before {
        content: '';
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        width: 1.25rem;
        height: 1.25rem;
        background: url('data:image/svg+xml;utf8,<svg fill="none" stroke="%235eead4" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>') no-repeat center center;
        background-size: 1.25rem 1.25rem;
        pointer-events: none;
        opacity: 0.8;
        z-index: 2;
      }

      /* Fix opblock expansion: background, border, corners */
      #swagger-ui .opblock {
        overflow: hidden !important;
      }
      #swagger-ui .opblock .opblock-summary {
        border-bottom: 1px solid hsl(var(--border)) !important;
      }
      #swagger-ui .opblock.is-open {
        box-shadow: 0 2px 16px 0 rgba(16,21,40,0.10) !important;
        border-radius: var(--radius) !important;
        border: 1px solid hsl(var(--primary)) !important;
        background: hsl(var(--popover)) !important;
      }
      #swagger-ui .opblock .opblock-section-header {
        background: hsl(var(--popover)) !important;
        border-radius: 0 0 var(--radius) var(--radius) !important;
        border-bottom: 1px solid hsl(var(--border)) !important;
      }
      #swagger-ui .opblock .opblock-body {
        background: hsl(var(--popover)) !important;
        border-radius: 0 0 var(--radius) var(--radius) !important;
        border-top: none !important;
        padding-bottom: 1rem !important;
      }

      /* Table headers and rows for parameters and responses */
      #swagger-ui table {
        background: hsl(var(--popover)) !important;
        border-radius: var(--radius) !important;
        border: 1px solid hsl(var(--border)) !important;
        overflow: hidden !important;
      }
      #swagger-ui th {
        background: hsl(var(--muted)) !important;
        color: hsl(var(--foreground)) !important;
        font-weight: 600 !important;
        border-bottom: 1px solid hsl(var(--border)) !important;
      }
      #swagger-ui td {
        background: hsl(var(--popover)) !important;
        color: hsl(var(--foreground)) !important;
        border-bottom: 1px solid hsl(var(--border)) !important;
      }
      #swagger-ui tr:last-child td {
        border-bottom: none !important;
      }

      /* Make all text light for readability */
      #swagger-ui,
      #swagger-ui .info,
      #swagger-ui .opblock,
      #swagger-ui .opblock .opblock-summary,
      #swagger-ui .opblock .opblock-section-header,
      #swagger-ui .opblock .opblock-body,
      #swagger-ui .parameters-col_description,
      #swagger-ui .response-col_description,
      #swagger-ui .parameter__name,
      #swagger-ui .response-col_status,
      #swagger-ui .tab li,
      #swagger-ui .tab li.active,
      #swagger-ui .model-title,
      #swagger-ui .model-box,
      #swagger-ui .markdown,
      #swagger-ui .markdown h1,
      #swagger-ui .markdown h2,
      #swagger-ui .markdown h3,
      #swagger-ui .markdown h4,
      #swagger-ui .markdown code,
      #swagger-ui label,
      #swagger-ui .parameter__type,
      #swagger-ui .parameter__in,
      #swagger-ui .parameter__deprecated,
      #swagger-ui .parameter__default,
      #swagger-ui .response-col_links,
      #swagger-ui .response-col_schema span {
        color: #f8fafc !important;
      }

      span {
        color: #f8fafc !important;
      }

      p {
        color: #f8fafc !important;
      }

      /* Style all inputs, selects, and textareas */
      #swagger-ui input,
      #swagger-ui select,
      #swagger-ui textarea {
        background: hsl(var(--input)) !important;
        color: #f8fafc !important;
        border: 1px solid hsl(var(--border)) !important;
        border-radius: var(--radius) !important;
        font-size: 1rem !important;
        padding: 0.5rem 1rem !important;
        box-shadow: none !important;
        outline: none !important;
        transition: border 0.2s;
      }
      #swagger-ui input:focus,
      #swagger-ui select:focus,
      #swagger-ui textarea:focus {
        border-color: hsl(var(--primary)) !important;
      }
      #swagger-ui input[readonly],
      #swagger-ui select[readonly],
      #swagger-ui textarea[readonly] {
        background: hsl(var(--muted)) !important;
        color: #94a3b8 !important;
      }
      #swagger-ui .parameter__name {
        color: #5eead4 !important;
      }
      #swagger-ui .parameter__in {
        color: #2dd4bf !important;
      }

      /* Sidebar note: 
         The sidebar only appears in "BaseLayout" if your OpenAPI spec has tags or multiple groups.
         If you see no sidebar, your spec may not have tags or groupings.
      */
    </style>
  </head>
  <body>
    
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function() {
        SwaggerUIBundle({
          url: '/openapi.json',
          dom_id: '#swagger-ui',
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIBundle.SwaggerUIStandalonePreset
          ],
          // Available layouts: "BaseLayout", "StandaloneLayout"
          layout: "BaseLayout",
          docExpansion: "list",
          filter: false,
        });
      };
    </script>
    <footer style="margin-top:2rem;text-align:center;color:#5eead4;font-size:1rem;opacity:0.7;">
      Powered by <span style="font-weight:600;">BreezeAPI</span>
    </footer>
  </body>
</html>`;
