FROM node:20.3.0

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 8000
RUN npm run build

CMD ["npm", "run", "start"]
