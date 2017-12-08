FROM node:carbon
RUN mkdir /src
WORKDIR /src
COPY app/package.json