FROM node:20-slim

# Install dependencies required for Puppeteer and other tools
RUN apt-get update && apt-get install -y \
    chromium \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    SHARP_IGNORE_GLOBAL_LIBVIPS=1

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --build-from-source

# Copy app source
COPY . .

# Create data directory for SQLite
RUN mkdir -p /data && chown -R node:node /data

# Use non-root user
USER node

CMD ["node", "index.js"]
