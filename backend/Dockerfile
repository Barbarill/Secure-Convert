FROM node:20-bookworm-slim

# LibreOffice headless: pacchetto principale, senza tutti gli extra grafici
# non necessari in un ambiente server (risparmia spazio nell'immagine).
RUN apt-get update && \
    apt-get install -y --no-install-recommends libreoffice-writer libreoffice-calc libreoffice-impress && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src ./src
RUN npm install typescript --no-save && npx tsc && npm uninstall typescript

EXPOSE 3001

# Ogni richiesta scrive ed elimina i propri file temporanei in /tmp del
# container: nessun volume persistente necessario, coerente con l'architettura
# "effimera" — al riavvio del container qualunque residuo sparisce comunque.
CMD ["node", "dist/index.js"]