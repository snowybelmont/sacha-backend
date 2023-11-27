FROM ghcr.io/puppeteer/puppeteer:21.5.2

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    PROD=false
    PORT=3001
    URI=mongodb+srv://belmont:AHtsBGZ2VGwLAG70@testezin.mec27qv.mongodb.net/?retryWrites=true&w=majority

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .
CMD [ "node", "./src/index.js"]