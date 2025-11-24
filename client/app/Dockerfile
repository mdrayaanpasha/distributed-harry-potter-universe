FROM node:20 AS build
WORKDIR /app

# Only copy package files
COPY package.json package-lock.json ./
RUN npm install

# Copy source only
COPY . .

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
