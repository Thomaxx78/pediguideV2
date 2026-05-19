FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose backend port
EXPOSE 3000

# Start dev server
CMD ["npm", "run", "dev"]