FROM nikolaik/python-nodejs:python3.11-nodejs20

WORKDIR /app

# Install Python dependencies first (cache layer)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy server package and install node dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install

# Copy the rest of the application
WORKDIR /app
COPY model/ ./model/
COPY server/ ./server/

# Run the server
WORKDIR /app/server
ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
