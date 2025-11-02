FROM node:20-alpine

WORKDIR /app/server/hagrids_hut_server

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3003

CMD ["node","index.js"]