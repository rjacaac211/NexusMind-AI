FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the frontend source code
COPY . .

# Build the frontend
RUN npm run build

# Expose port
EXPOSE 3000

# Run the frontend app using serve
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]