# RAG Chatbot Setup Guide

This guide will help you set up the RAG (Retrieval-Augmented Generation) chatbot for your Argo Float database.

## Features

- 🤖 Natural language queries to your PostgreSQL database
- 🔍 SQL query generation from user questions
- 📊 Real-time data visualization in chat
- 🗣️ Conversational responses using Qwen3 Coder model
- 🔒 Secure SQL injection protection
- 📱 Responsive chat interface

## Prerequisites

1. **PostgreSQL Database**: Your Argo float database should be running
2. **OpenRouter API Key**: Get a free API key from [OpenRouter](https://openrouter.ai/)
3. **Node.js**: Version 16 or higher

## Setup Instructions

### 1. Install Dependencies

Navigate to the server directory and install the RAG service dependencies:

```bash
cd server
npm install express cors pg node-fetch
```

### 2. Set Environment Variables

Create a `.env` file in the server directory:

```bash
# Database Configuration
DB_USER=ayush
DB_HOST=localhost
DB_NAME=postgres
DB_PASS=secret123
DB_PORT=5432

# OpenRouter API Configuration
OPENROUTER_API_KEY=your-openrouter-api-key-here
```

### 3. Start the RAG Service

Run the RAG chatbot service:

```bash
node rag-service.js
```

The service will start on `http://localhost:5002`

### 4. Start the Frontend

In a new terminal, navigate to the client directory and start the React app:

```bash
cd client
npm start
```

The frontend will be available at `http://localhost:3000`

### 5. Access the Chatbot

Navigate to `http://localhost:3000/chat` to access the AI chatbot interface.

## API Endpoints

### Chat Endpoint
- **POST** `/api/chat`
- **Body**: `{ "message": "your question", "conversationHistory": [] }`
- **Response**: Natural language response with SQL query and data

### Health Check
- **GET** `/api/health`
- **Response**: Service status and configuration

### Sample Queries
- **GET** `/api/sample-queries`
- **Response**: List of example questions

### Database Schema
- **GET** `/api/schema`
- **Response**: Database table structure

## Example Queries

Try these sample questions in the chatbot:

1. **"Show me all available floats"**
2. **"What's the latest location of float 1900816?"**
3. **"What's the average temperature for float 1900816?"**
4. **"Show me all measurements from 2023"**
5. **"What floats are in the Atlantic Ocean?"**
6. **"Show me the temperature range for all floats"**
7. **"Which float has the highest salinity measurements?"**
8. **"Show me data from floats in the Pacific Ocean"**
9. **"What's the deepest pressure measurement recorded?"**
10. **"Show me monthly averages for float 1900816"**

## Database Schema

The chatbot understands this database structure:

```sql
Table: floats
Columns:
- platform_id (text): Unique identifier for each float/platform
- measurement_date (timestamp): When the measurement was taken
- latitude (float): Geographic latitude coordinate
- longitude (float): Geographic longitude coordinate  
- pressure_dbar (float): Pressure measurement in decibars
- temperature_celsius (float): Temperature measurement in Celsius
- salinity_psu (float): Salinity measurement in practical salinity units
```

## Security Features

- ✅ Only SELECT queries allowed
- ✅ SQL injection protection
- ✅ Parameterized queries
- ✅ Dangerous keyword filtering
- ✅ Query result limiting

## Troubleshooting

### Common Issues

1. **"OpenRouter API error"**
   - Check your API key in the `.env` file
   - Ensure you have credits in your OpenRouter account

2. **"Database connection error"**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`

3. **"Only SELECT queries are allowed"**
   - The chatbot only supports read operations for security

4. **Frontend not loading**
   - Ensure both services are running (RAG service on 5002, React on 3000)
   - Check browser console for CORS errors

### Logs

Check the console output for both services:
- RAG service logs: SQL queries and API responses
- Frontend logs: Network requests and errors

## Customization

### Adding New Query Types

Edit the system prompt in `rag-service.js` to add support for new query patterns:

```javascript
const systemPrompt = `You are a SQL expert for an Argo float oceanographic database.
// Add your custom instructions here
`;
```

### Modifying the UI

The chat interface is in `client/src/components/ChatBot.jsx` and styled with `ChatBot.css`.

### Changing the AI Model

Update the model name in `rag-service.js`:

```javascript
model: "qwen/qwen3-coder:free"  // Change to your preferred model
```

## Support

For issues or questions:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all services are running on the correct ports
4. Test the database connection independently

## Model Information

- **Model**: Qwen3 Coder 480B A35B (free)
- **Provider**: OpenRouter
- **Use Case**: SQL generation and natural language responses
- **Cost**: Free tier available


