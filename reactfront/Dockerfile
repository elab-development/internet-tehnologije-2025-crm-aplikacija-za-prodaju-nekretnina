FROM node:20-alpine

WORKDIR /app

COPY reactfront/package.json reactfront/package-lock.json ./
RUN npm ci

COPY reactfront .

EXPOSE 3000
CMD ["npm", "start"]