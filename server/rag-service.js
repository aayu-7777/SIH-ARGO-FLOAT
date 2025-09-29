import express from "express";
import cors from "cors";
import pkg from "pg";
import fetch from "node-fetch";

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || "ayush",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "postgres",
  password: process.env.DB_PASS || "secret123",
  port: process.env.DB_PORT || 5432,
});

// Gemini API configuration
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || "REDACTED_GEMINI_KEY"; // set GEMINI_API_KEY in env
const GEMINI_MODEL_ID = process.env.GEMINI_MODEL_ID || "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_ID}:generateContent?key=${GEMINI_API_KEY}`;

// Database schema information for context
const DB_SCHEMA = `
Database Schema for Argo Float Data:

Table: floats
Columns:
- platform_id (text): Unique identifier for each float/platform
- measurement_date (timestamp): When the measurement was taken
- latitude (float): Geographic latitude coordinate
- longitude (float): Geographic longitude coordinate  
- pressure_dbar (float): Pressure measurement in decibars
- temperature_celsius (float): Temperature measurement in Celsius
- salinity_psu (float): Salinity measurement in practical salinity units

Sample queries:
- Get all unique platform IDs: SELECT DISTINCT platform_id FROM floats
- Get latest location for a platform: SELECT platform_id, latitude, longitude FROM floats WHERE platform_id = 'X' ORDER BY measurement_date DESC LIMIT 1
- Get temperature range for a platform: SELECT MIN(temperature_celsius), MAX(temperature_celsius), AVG(temperature_celsius) FROM floats WHERE platform_id = 'X'
- Get data within date range: SELECT * FROM floats WHERE measurement_date BETWEEN '2023-01-01' AND '2023-12-31'
- Get data within geographic bounds: SELECT * FROM floats WHERE latitude BETWEEN 30 AND 40 AND longitude BETWEEN -80 AND -70
`;

// Helper: call Gemini text generation
async function geminiGenerate(prompt, { maxTokens = 512, temperature = 0.2 } = {}) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  const body = {
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  };
  const resp = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Gemini API error: ${resp.status} ${resp.statusText} ${txt}`);
  }
  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return String(text);
}

// Function to generate SQL from natural language using Gemini
async function generateSQL(userQuery, conversationHistory = []) {
  const prompt = `You are a SQL expert for an Argo float oceanographic database.\n\nDatabase Schema:\n${DB_SCHEMA}\n\nWrite a single PostgreSQL SELECT query that answers the user's question.\nRules:\n- Return ONLY the SQL, no explanations.\n- Prefer parameterized filters, but if the question includes a concrete platform id, use it directly.\n- Use measurement_date for time filters.\n- Include ORDER BY when returning multiple rows.\n- Add LIMIT 100 when result set may be large.\n\nUser question: ${userQuery}`;
  try {
    const sql = await geminiGenerate(prompt, { maxTokens: 200, temperature: 0.1 });
    const match = sql.match(/```sql\s*([\s\S]*?)```/i) || sql.match(/```\s*([\s\S]*?)```/i);
    const clean = (match ? match[1] : sql).trim().replace(/^SQL\s*:/i, "").trim();
    return clean;
  } catch (error) {
    console.error("Error generating SQL:", error);
    throw error;
  }
}

// Function to execute SQL query safely
async function executeQuery(sql, params = []) {
  try {
    // Basic SQL injection protection - only allow SELECT statements
    const trimmedSQL = sql.trim().toLowerCase();
    if (!trimmedSQL.startsWith('select')) {
      throw new Error("Only SELECT queries are allowed");
    }

    // Remove dangerous keywords
    const dangerousKeywords = ['drop', 'delete', 'insert', 'update', 'alter', 'create', 'truncate'];
    for (const keyword of dangerousKeywords) {
      if (trimmedSQL.includes(keyword)) {
        throw new Error(`Dangerous keyword '${keyword}' not allowed`);
      }
    }

    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}

// Normalize model output to plain SQL (strip code fences, labels, extra whitespace)
function sanitizeSql(sql) {
  if (!sql) return "";
  let s = String(sql).trim();
  // Remove leading ```sql or ``` and trailing ```
  s = s.replace(/^```sql\s*/i, "");
  s = s.replace(/^```\s*/i, "");
  s = s.replace(/```\s*$/i, "");
  // Remove leading SQL: labels
  s = s.replace(/^sql\s*:\s*/i, "");
  // Trim again
  s = s.trim();
  return s;
}

// Function to generate natural language response using Gemini
async function generateResponse(userQuery, sqlQuery, queryResults, conversationHistory = []) {
  const resultsContext = queryResults.length > 0 
    ? `Query Results (${queryResults.length} rows):\n${JSON.stringify(queryResults.slice(0, 10), null, 2)}`
    : "Query returned no results";

  const prompt = `You are a helpful oceanographic data assistant.\n\nDatabase Context:\n${DB_SCHEMA}\n\nUser asked: "${userQuery}"\nSQL executed: ${sqlQuery}\n${resultsContext}\n\nExplain the results clearly and concisely, suggest one related follow-up query, and keep the tone professional.`;

  try {
    const text = await geminiGenerate(prompt, { maxTokens: 500, temperature: 0.5 });
    return text.trim();
  } catch (error) {
    console.error("Error generating response:", error);
    return "I apologize, but I'm having trouble generating a response right now. The query was executed successfully, but I couldn't provide a natural language explanation.";
  }
}

// Chat endpoint
// Updated chat endpoint using Gemini for full response
app.post("/api/chat", async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("User query:", message);

    // Try to generate SQL first
    let response, sqlQuery = null, queryResults = [];
    
    try {
      // Generate SQL query
      sqlQuery = await generateSQL(message, conversationHistory);
      console.log("Generated SQL:", sqlQuery);
      
      // Execute the query
      queryResults = await executeQuery(sqlQuery);
      console.log("Query results:", queryResults.length, "rows");
      
      // Generate natural language response
      response = await generateResponse(message, sqlQuery, queryResults, conversationHistory);
      
    } catch (sqlError) {
      console.log("SQL generation failed, trying text response:", sqlError.message);
      
      // If SQL fails, try a direct text response
      const textPrompt = `You are a helpful oceanographic data assistant. The user asked: "${message}". 
      
Provide a helpful response about Argo float data. If you can't answer their specific question, suggest some sample queries they could try like:
- "Show me all available floats"
- "What's the latest location of float 1900816?"
- "Show me temperature data for a specific float"

Keep your response friendly and helpful.`;

      response = await geminiGenerate(textPrompt, { maxTokens: 300, temperature: 0.3 });
    }

    const updatedHistory = [
      ...conversationHistory,
      { role: "user", content: message },
      { role: "assistant", content: response }
    ];

    res.json({
      response,
      sqlQuery,
      resultsCount: queryResults.length,
      conversationHistory: updatedHistory,
      data: queryResults.slice(0, 50)
    });

  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ 
      error: "Failed to process chat message",
      details: error.message 
    });
  }
});


// Get database schema info
app.get("/api/schema", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'floats' 
      ORDER BY ordinal_position
    `);
    
    res.json({
      table: "floats",
      columns: result.rows
    });
  } catch (error) {
    console.error("Schema error:", error);
    res.status(500).json({ error: "Failed to fetch schema" });
  }
});

// Get sample queries
app.get("/api/sample-queries", (req, res) => {
  const sampleQueries = [
    "Show me all available floats",
    "What's the latest location of float 1901740?",
    "What's the average temperature for float 1901740?",
    "Show me all measurements from 2025",
    "What floats are in the Atlantic Ocean?",
    "Show me the temperature range for all floats",
    "Which float has the highest salinity measurements?",
    "Show me data from floats in the Pacific Ocean",
    "What's the deepest pressure measurement recorded?",
    "Show me monthly averages for float 1901740"
  ];
  
  res.json({ sampleQueries });
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ 
      status: "healthy", 
      database: "connected",
      gemini: GEMINI_API_KEY ? "configured" : "not configured",
      model: GEMINI_MODEL_ID
    });
  } catch (error) {
    res.status(500).json({ 
      status: "unhealthy", 
      error: error.message 
    });
  }
});

const PORT = 5002;
app.listen(PORT, () => {
  console.log(`🤖 RAG Chatbot service running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME || "postgres"}`);
  console.log(`🔑 Gemini API: ${GEMINI_API_KEY ? "configured" : "not configured"} | Model: ${GEMINI_MODEL_ID}`);
});


