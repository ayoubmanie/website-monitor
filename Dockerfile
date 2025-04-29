FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --production

COPY . .

# Install cron
RUN apk add --no-cache busybox-suid dcron

# Add crontab file
COPY crontab /etc/crontabs/root

# Create log file
RUN touch /var/log/cron.log

# Start cron and run the application
CMD ["sh", "-c", "crond -l 2 -b && tail -f /var/log/cron.log"]