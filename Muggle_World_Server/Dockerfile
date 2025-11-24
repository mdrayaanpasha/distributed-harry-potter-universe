FROM node:20-alpine

WORKDIR /app/server/muggle_world_server

COPY package*.json ./

RUN npm install

COPY . .

COPY .env.docker .env

EXPOSE 3005

RUN npx prisma generate

CMD [ "node","index.js" ]