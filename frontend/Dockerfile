FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
# HEALTHCHECK에서 쓰는 curl을 명시적으로 설치 (nginx:alpine 베이스에 기본 포함이 아님)
# busybox wget은 localhost를 IPv6(::1)로 먼저 해석하고 폴백을 안 해서 헬스체크가 실패함 → curl 사용
RUN apk add --no-cache curl
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=30s \
  CMD curl -fsS -o /dev/null http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
