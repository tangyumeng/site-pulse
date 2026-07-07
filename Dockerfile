FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
ENV PORT=4050
ENV DATA_DIR=/data
VOLUME ["/data"]
EXPOSE 4050
CMD ["node", "src/server.js"]
