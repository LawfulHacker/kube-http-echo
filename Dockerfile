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

ARG VERSION
ENV VERSION=${VERSION:-v1.0.0}

EXPOSE 5000
ENV PORT=5000

COPY --from=builder /app/dist/index.js .

CMD [ "node", "index.js" ]
