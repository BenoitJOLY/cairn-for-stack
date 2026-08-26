# Build depuis la racine du dépôt : docker build -t cairn-for-stack-server .
FROM node:20-alpine
WORKDIR /app

COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --omit=dev

COPY index.html depot.html login.html register.html ./
COPY js ./js
COPY css ./css
COPY lang ./lang
COPY lib ./lib
COPY assets ./assets
COPY server ./server

# Lancé via "sh" (pas en exécutable direct) : server/ est monté en volume
# depuis l'hôte (docker-compose.yml) pour permettre les mises à jour de code
# sans reconstruction d'image — le bit +x du fichier hôte n'est pas fiable
# après un upload File Station, "sh" n'en a pas besoin.
ENV PORT=3000
EXPOSE 3000
ENTRYPOINT ["sh", "server/entrypoint.sh"]
