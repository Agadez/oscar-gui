FROM node:lts-bullseye AS builder
# RUN mkdir -p /oscar-gui/src && mkdir -p /oscar-gui/e2e+
RUN mkdir -p /oscar-gui/src
COPY src /oscar-gui/src/
# COPY e2e /oscar-gui/e2e/
COPY package.json ts*.json angular.json /oscar-gui/
WORKDIR /oscar-gui
RUN yarn install
# ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build

FROM nginx:stable
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder oscar-gui/dist/oscar-gui/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

CMD ["/bin/sh",  "-c",  "envsubst < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js && exec nginx -g 'daemon off;'"]