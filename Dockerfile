#
# Builder image
#
FROM node:12 as builder

WORKDIR /app

COPY ./package-lock.json .
COPY ./package.json .
RUN npm ci

COPY . .

RUN npm run build

#
# Final image
#
FROM node:12

WORKDIR /app

EXPOSE 5000
ENV PORT=5000

COPY --from=builder /app/dist/index.js .

CMD [ "node", "index.js" ]
