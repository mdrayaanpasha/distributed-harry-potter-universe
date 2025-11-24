FROM node:20-alpine 

WORKDIR /app/server/gryffindor_tower_server

COPY package*.json ./

RUN npm install

COPY . . 

COPY .env.docker .env


EXPOSE 3002

CMD ["node","index.js"]