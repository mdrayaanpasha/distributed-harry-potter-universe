FROM node:20-alpine

WORKDIR /app/server/hagrids_hut_server

COPY package*.json ./

RUN npm install

COPY . .

COPY .env.docker .env


EXPOSE 3003

RUN npx prisma generate

CMD ["node","index.js"]