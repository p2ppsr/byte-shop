FROM node:22.23.4-alpine

EXPOSE 8080
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
ENV PATH="/app/node_modules/.bin:${PATH}"
COPY . .
CMD ["sh", "scripts/start.sh"]
