FROM node:carbon
EXPOSE 3000

RUN mkdir /src
WORKDIR /src
COPY ./app /src
RUN npm install

CMD node runner.js
