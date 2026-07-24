FROM node:18-slim

WORKDIR /app

# Salin dependensi package.json
COPY package*.json ./
RUN npm install --production

# Salin seluruh berkas proyek ke kontainer
COPY . .

EXPOSE 3000

# Jalankan server Express
CMD ["npm", "start"]