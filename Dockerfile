FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build

EXPOSE 3000

CMD ["sh", "-c", "npm run db:setup && npm run seed && npm run start -- --hostname 0.0.0.0"]
