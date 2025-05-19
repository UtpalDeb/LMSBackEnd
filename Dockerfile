FROM node.js 18

WORKDIR /index

COPY . /index

RUN npm install

CMD ["nodejs", "index.js"]