FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install --include=dev
COPY . .
ARG VITE_API_URL=
ARG VITE_SOCKET_URL=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
RUN npm run build

FROM nginx:1.28-alpine
COPY nginx/static.conf /etc/nginx/static.conf
COPY nginx/proxy.conf.template /etc/nginx/proxy.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
COPY --from=build /app/dist /usr/share/nginx/html
RUN apk add --no-cache gettext \
  && chmod +x /docker-entrypoint.sh \
  && rm -f /etc/nginx/conf.d/default.conf
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
