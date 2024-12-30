FROM node:20-alpine

RUN mkdir /app
WORKDIR /app

COPY ./package.json .

RUN apk add --no-cache bash

RUN npm i

COPY . .

RUN npm run initPrisma

EXPOSE 3002

CMD ["npm", "start"]