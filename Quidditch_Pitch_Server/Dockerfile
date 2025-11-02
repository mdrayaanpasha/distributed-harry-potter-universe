from node:18-alpine

WORKDIR /app/server/quidditch_pitch_server

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3007

CMD [ "node","index.js" ]