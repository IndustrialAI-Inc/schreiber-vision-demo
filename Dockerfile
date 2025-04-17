FROM node:18-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache python3 make g++ gcc libc-dev postgresql-client

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy the start script first
COPY start.sh ./
RUN chmod +x ./start.sh

# Copy the rest of the application
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV POSTGRES_URL=postgres://postgres:postgres@postgres:5432/schreiber
ENV AUTH_SECRET=vDIeKgZ/VEv8NgCeUM11qQ9W/7o86SkZHw3UGbf0LGs=
ENV XAI_API_KEY=dummy_key
ENV BLOB_READ_WRITE_TOKEN=dummy_token

# Expose port
EXPOSE 3000

# Start the application with our custom script
CMD ["sh", "./start.sh"]
