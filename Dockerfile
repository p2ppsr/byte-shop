FROM node:16-alpine
EXPOSE 8080
WORKDIR /app
COPY package.json .
RUN npm i
RUN npm i knex -g
COPY . .
RUN npm remove toidentifier
CMD [ "sh", "scripts/start.sh"]
