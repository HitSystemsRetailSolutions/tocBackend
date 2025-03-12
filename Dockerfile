FROM node:20

WORKDIR /usr/src

RUN apt-get update && apt-get install -y iputils-ping

COPY ["package.json", "package-lock.json",  "/usr/src"]

RUN npm install

COPY [".", "/usr/src/"]

RUN npm run build

EXPOSE 3000 5051

CMD [ "npm", "start" ]
