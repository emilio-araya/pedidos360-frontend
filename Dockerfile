# syntax=docker/dockerfile:1

FROM node:26-alpine AS build
ARG ENTRA_TENANT_ID
ARG ENTRA_CLIENT_ID
ARG API_SCOPE
ARG API_BASE_URL
ARG REDIRECT_URI
ARG POST_LOGOUT_REDIRECT_URI
ARG COGNITO_USER_POOL_ID
ARG COGNITO_USER_POOL_CLIENT_ID
ARG COGNITO_DOMAIN
ARG COGNITO_ISSUER
ARG COGNITO_REDIRECT_URI
ARG COGNITO_LOGOUT_URI
ARG COGNITO_API_SCOPE
WORKDIR /workspace

COPY package*.json ./
RUN npm ci
COPY . .

RUN node scripts/generate-environment.js

RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
