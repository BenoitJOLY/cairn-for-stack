# Build depuis la racine du dépôt : docker build -t stackforge-server .
FROM node:20-alpine
WORKDIR /app

COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --omit=dev

COPY index.html depot.html ./
COPY js ./js
COPY css ./css
COPY lang ./lang
COPY lib ./lib
COPY assets ./assets
COPY server ./server

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server/server.js"]
