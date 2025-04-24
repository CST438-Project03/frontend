FROM node:18

# Optional: Install JDK for Android builds
RUN apt-get update && apt-get install -y openjdk-17-jdk

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# React Native runs Metro bundler (default dev server)
EXPOSE 8081

CMD ["npx", "react-native", "start"]
