FROM node:lts-bullseye AS builder
RUN mkdir -p /oscar-gui/src && mkdir -p /oscar-gui/e2e
COPY src /oscar-gui/src/
COPY e2e /osrc-gui/e2e/
COPY package.json ts*.json angular.json /oscar-gui/
WORKDIR /oscar-gui
RUN yarn install
# ENV NODE_OPTIONS=--openssl-legacy-provider
RUN $(npm bin)/ng build --prod

FROM nginx:stable
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder oscar-gui/dist/oscar-gui/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
