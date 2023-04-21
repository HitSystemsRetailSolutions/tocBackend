FROM node

RUN mkdir -p /home/hit/toc/ 

#RUN chown -R hit:hit /home/hit/toc

WORKDIR /home/hit/toc

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000 5051

CMD [ "npm", "start" ]