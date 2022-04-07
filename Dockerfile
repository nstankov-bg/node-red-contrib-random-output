FROM nodered/node-red:1.3.5-12-arm32v6

COPY ./data /usr/src/
COPY ./flow-data /data
USER root

RUN npm install node-red-node-pi-gpio raspi-gpio raspi-io
RUN chown -R 1000:1000 /usr/src/node-red/
RUN chown -R 1000:1000 /data
USER 1000

