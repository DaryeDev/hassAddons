FROM node:20-alpine

RUN npm install -g 9router

RUN mkdir -p /config
ENV HOME=/config

EXPOSE 20128

CMD ["9router"]