FROM node:carbon
EXPOSE 3000

RUN mkdir /src
WORKDIR /src
COPY ./app /src
RUN npm app/packages.json

CMD node app/bin/www
