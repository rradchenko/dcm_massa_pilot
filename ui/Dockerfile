
FROM node:16
ENV DEBIAN_FRONTEND=noninteractive
ARG APP_NAME=XXXXXXXX
ARG APP_HOME=/opt

COPY . ${APP_HOME}/${APP_NAME}
WORKDIR ${APP_HOME}/${APP_NAME}

RUN set -x \
  && apt-get update -qq \
  && apt-get install -qq --no-install-recommends --no-install-suggests -y curl \
  && npm ci --progress=false --loglevel=error --no-update-notifier --no-audit \
  && apt-get remove -qq --purge --auto-remove -y \
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /tmp/*

