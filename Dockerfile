# This dockerfile specifies the environment the production
# code will be run in, along with what files are needed
# for production

# Use an official Node.js runtime as the base image
FROM node:iron-bookworm-slim

# Use a non-interactive frontend for debconf
ENV DEBIAN_FRONTEND=noninteractive

# Set working directory
WORKDIR /app

# Create a user within the container
RUN useradd -m exsys_backend_user

# Copy the app directory, package.json, package-lock.json and Config directory
COPY dist/app/ ./
COPY package*.json ./
COPY config/ ./config/

# Change the ownership of the copied files to backend_user
RUN chown -R exsys_backend_user:exsys_backend_user /app

# Switch to user for subsequent commands
USER exsys_backend_user

# Clean install production dependencies
RUN npm ci --omit=dev

# Expose the port Express.js runs on
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]
