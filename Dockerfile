FROM debian:bullseye as builder

ARG NODE_VERSION=16.17.0

RUN apt-get update; apt install -y curl
RUN curl https://get.volta.sh | bash
ENV VOLTA_HOME /root/.volta
ENV PATH /root/.volta/bin:$PATH
RUN volta install node@${NODE_VERSION}

#######################################################################

RUN mkdir /app
WORKDIR /app

# NPM will not install any package listed in "devDependencies" when NODE_ENV is set to "production",
# to install all modules: "npm install --production=false".
# Ref: https://docs.npmjs.com/cli/v9/commands/npm-install#description

FROM zenika/alpine-chrome:89-with-node-14

COPY package*.json ./

RUN npm install

ENV NODE_ENV production

COPY . .

RUN npm install
FROM debian:bullseye


LABEL fly_launch_runtime="nodejs"

COPY --from=builder /root/.volta /root/.volta
COPY --from=builder /app /app

WORKDIR /app
ENV NODE_ENV production
ENV PATH /root/.volta/bin:$PATH
ENV PUPPETEER_EXECUTABLE_PATH='/usr/bin/chromium-browser'

CMD [ "npm", "run", "start" ]
