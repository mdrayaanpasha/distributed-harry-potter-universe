FROM node:20-alpine

WORKDIR /app/servers/great_library_server

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD ["node","index.js"]

