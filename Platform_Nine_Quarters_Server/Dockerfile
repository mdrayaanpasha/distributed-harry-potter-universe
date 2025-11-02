from node:18-alpine

WORKDIR /app/server/platform_nine_quarters_server

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3006

CMD [ "node","index.js" ]