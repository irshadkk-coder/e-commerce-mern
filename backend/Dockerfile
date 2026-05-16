FROM node:20-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY app.js ./
COPY config ./config
COPY controllers ./controllers
COPY middleware ./middleware
COPY routes ./routes
COPY services ./services
COPY utils ./utils
COPY validators ./validators
COPY scripts ./scripts
COPY public ./public

RUN mkdir -p public/product-images && chown -R nodeapp:nodeapp /app
USER nodeapp

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/products?limit=1').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "app.js"]
