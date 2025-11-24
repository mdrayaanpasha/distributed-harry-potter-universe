from node:18-alpine

WORKDIR /app/server/platform_nine_quarters_server

COPY package*.json ./

RUN npm install

COPY . .

COPY .env.docker .env


EXPOSE 3006

RUN npx prisma generate

CMD [ "node","index.js" ]