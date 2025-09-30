# RAG Chatbot Setup Guide

This guide will help you set up the RAG (Retrieval-Augmented Generation) chatbot for your Argo Float database.

## Features

- 🤖 Natural language queries to your PostgreSQL database
- 🔍 SQL query generation from user questions
- 📊 Real-time data visualization in chat
- 🗣️ Conversational responses using Google Gemini AI
- 🔒 Secure SQL injection protection
- 📱 Responsive chat interface with modern dark theme
- 🎨 Glassmorphism UI design
- ⚡ Optimized performance with React hooks

## Prerequisites

1. **PostgreSQL Database**: Your Argo float database should be running
2. **Google Gemini API Key**: Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
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

# Google Gemini API Configuration
GEMINI_API_KEY=your-google-gemini-api-key-here
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
2. **"What's the latest temperature data from 2025?"**
3. **"Find floats in the Pacific Ocean"**
4. **"Show salinity profiles for float 1901740"**
5. **"What's the average depth of measurements in 2025?"**
6. **"Find floats with the highest temperature readings"**
7. **"Show me all measurements from 2025"**
8. **"What's the latest location of float 1901740?"**
9. **"What's the average temperature for float 1901740?"**
10. **"Show me monthly averages for float 1901740"**

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

1. **"Google Gemini API error"**
   - Check your API key in the `.env` file
   - Ensure you have credits in your Google AI Studio account
   - Verify the API key has the correct permissions

2. **"Database connection error"**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`

3. **"Only SELECT queries are allowed"**
   - The chatbot only supports read operations for security

4. **Frontend not loading**
   - Ensure both services are running (RAG service on 5002, React on 3000)
   - Check browser console for CORS errors

5. **"ChatBot not responding"**
   - Check if the RAG service is running on port 5002
   - Verify the GEMINI_API_KEY is set correctly
   - Check server logs for error messages

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

Update the model configuration in `rag-service.js`:

```javascript
// Google Gemini model configuration
const modelConfig = {
  model: "gemini-1.5-flash",  // Change to your preferred Gemini model
  maxTokens: 1000,
  temperature: 0.1
};
```

## Support

For issues or questions:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all services are running on the correct ports
4. Test the database connection independently

## Model Information

- **Model**: Google Gemini 1.5 Flash
- **Provider**: Google AI Studio
- **Use Case**: SQL generation and natural language responses
- **Cost**: Free tier available with generous limits
- **Features**: Fast response times, excellent code generation, multilingual support

## Recent Updates

- ✅ **Updated to Google Gemini AI** - Better performance and reliability
- ✅ **Modern UI Design** - Dark theme with glassmorphism effects
- ✅ **Updated Sample Queries** - Reflects 2025 data and float 1901740
- ✅ **Enhanced Error Handling** - Better user experience and debugging
- ✅ **Performance Optimizations** - React hooks for better responsiveness


