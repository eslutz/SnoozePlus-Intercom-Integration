FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

# Copy source code
COPY . .

# Create non-root user for development
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

# Give nodejs user ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 8706

# Start development server with hot reloading
CMD ["npm", "run", "dev"]
