FROM node:20-alpine

WORKDIR /app/server/master_server

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3008

CMD [ "node","index.js" ]