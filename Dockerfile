# From the base image node
FROM node:18-alpine
WORKDIR /CrypticTalk
ENV NODE_ENV=production

# Copy all the files from your file system to the container file system
COPY ["package.json", "package-lock.json*", "./"]

# Install all dependencies
RUN npm install

# Copy other files as well
# COPY.

# Expose the port
EXPOSE 5500

# Command to execute when the image is instantiated
CMD [ "node", "server.js" ]