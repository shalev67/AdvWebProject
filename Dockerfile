FROM node:carbon
EXPOSE 5000

RUN mkdir /src
WORKDIR /src
COPY ./app /src
RUN npm install

CMD node runner.js
