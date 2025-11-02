FROM node:20-alpine

WORKDIR /app/server/muggle_world_server

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3005

CMD [ "node","index.js" ]