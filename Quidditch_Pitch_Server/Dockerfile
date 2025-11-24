from node:18-alpine

WORKDIR /app/server/quidditch_pitch_server

COPY package*.json ./

RUN npm install

COPY . .

COPY .env.docker .env


EXPOSE 3007

RUN npx prisma generate

CMD [ "node","index.js" ]