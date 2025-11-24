FROM node:20-alpine

WORKDIR /app/server/herbology_greenhouse_server

COPY package*.json ./

RUN npm install

COPY . .

COPY .env.docker .env


EXPOSE 3004

RUN npx prisma generate

CMD [ "node","index.js" ]