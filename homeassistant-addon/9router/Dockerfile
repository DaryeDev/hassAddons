FROM decolua/9router:latest

USER root

RUN apk add --no-cache nginx netcat-openbsd && \
    mkdir -p /run/nginx /etc/nginx/http.d && \
    rm -f /etc/nginx/http.d/default.conf

COPY rootfs/etc/nginx/nginx.conf /etc/nginx/nginx.conf
COPY rootfs/etc/nginx/http.d/ingress.conf /etc/nginx/http.d/ingress.conf
COPY rootfs/etc/nginx/ingress-bootstrap.js /etc/nginx/ingress-bootstrap.js
COPY run.sh /run.sh
RUN chmod +x /run.sh

EXPOSE 20128 8099

ENTRYPOINT []
CMD ["/run.sh"]
