FROM node:24-bookworm

# Update system packages to address vulnerabilities
USER root
RUN apt-get update && apt-get upgrade -y && apt-get clean

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

# Copy source code
COPY . .

# Create non-root user for development
RUN groupadd -g 1001 nodejs && \
  useradd -m -u 1001 -g nodejs nodejs

# Give nodejs user ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 8706

# Start development server with hot reloading
CMD ["npm", "run", "dev"]
