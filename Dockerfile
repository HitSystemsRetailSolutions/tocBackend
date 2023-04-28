FROM node 

WORKDIR /usr/src

COPY ["package.json", "package-lock.json",  "/usr/src"]

RUN npm install

COPY [".", "/usr/src/"]

RUN npm run build

EXPOSE 3000 5051

CMD [ "npm", "start" ]
