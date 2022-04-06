FROM nodered/node-red

COPY ./data /usr/src/
USER root
RUN chown -R 1000:1000 /usr/src/node-red/
USER 1000
