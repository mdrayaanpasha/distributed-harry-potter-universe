FROM node:20-alpine

WORKDIR /app/server/herbology_greenhouse_server

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3004

CMD [ "node","index.js" ]