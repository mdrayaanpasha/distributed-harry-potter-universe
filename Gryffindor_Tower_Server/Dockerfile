FROM node:20-alpine 

WORKDIR /app/server/gryffindor_tower_server

COPY package*.json ./

RUN npm install

COPY . . 

EXPOSE 3002

CMD ["node","index.js"]