import express from "express";
import cors from "cors";
import pkg from "pg";

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

// Sample queries for demo
const sampleQueries = [
  "Show me all available floats",
  "What's the latest location of float 1900816?",
  "What's the average temperature for float 1900816?",
  "Show me all measurements from 2023",
  "What floats are in the Atlantic Ocean?",
  "Show me the temperature range for all floats",
  "Which float has the highest salinity measurements?",
  "Show me data from floats in the Pacific Ocean",
  "What's the deepest pressure measurement recorded?",
  "Show me monthly averages for float 1900816"
];

// Simple SQL generation based on keywords
function generateSQL(userQuery) {
  const query = userQuery.toLowerCase();
  
  if (query.includes("all available floats") || query.includes("show me all floats")) {
    return "SELECT DISTINCT platform_id FROM floats ORDER BY platform_id";
  }
  
  if (query.includes("latest location") && query.includes("1900816")) {
    return "SELECT platform_id, latitude, longitude FROM floats WHERE platform_id = '1900816' ORDER BY measurement_date DESC LIMIT 1";
  }
  
  if (query.includes("average temperature") && query.includes("1900816")) {
    return "SELECT AVG(temperature_celsius) as avg_temp FROM floats WHERE platform_id = '1900816' AND temperature_celsius IS NOT NULL";
  }
  
  if (query.includes("2023")) {
    return "SELECT platform_id, measurement_date, temperature_celsius, salinity_psu FROM floats WHERE EXTRACT(YEAR FROM measurement_date) = 2023 LIMIT 10";
  }
  
  if (query.includes("atlantic ocean")) {
    return "SELECT DISTINCT platform_id FROM floats WHERE longitude BETWEEN -80 AND -20 AND latitude BETWEEN 0 AND 60 LIMIT 10";
  }
  
  if (query.includes("temperature range")) {
    return "SELECT MIN(temperature_celsius) as min_temp, MAX(temperature_celsius) as max_temp, AVG(temperature_celsius) as avg_temp FROM floats WHERE temperature_celsius IS NOT NULL";
  }
  
  if (query.includes("highest salinity")) {
    return "SELECT platform_id, MAX(salinity_psu) as max_salinity FROM floats WHERE salinity_psu IS NOT NULL GROUP BY platform_id ORDER BY max_salinity DESC LIMIT 5";
  }
  
  if (query.includes("pacific ocean")) {
    return "SELECT DISTINCT platform_id FROM floats WHERE longitude BETWEEN 120 AND -120 AND latitude BETWEEN -60 AND 60 LIMIT 10";
  }
  
  if (query.includes("deepest pressure")) {
    return "SELECT platform_id, MAX(pressure_dbar) as max_pressure FROM floats WHERE pressure_dbar IS NOT NULL GROUP BY platform_id ORDER BY max_pressure DESC LIMIT 5";
  }
  
  if (query.includes("monthly averages") && query.includes("1900816")) {
    return "SELECT DATE_TRUNC('month', measurement_date) AS month, AVG(temperature_celsius) as avg_temp, AVG(salinity_psu) as avg_salinity FROM floats WHERE platform_id = '1900816' GROUP BY month ORDER BY month";
  }
  
  // Default query
  return "SELECT platform_id, measurement_date, temperature_celsius, salinity_psu FROM floats LIMIT 10";
}

// Execute SQL query safely
async function executeQuery(sql) {
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

    const result = await pool.query(sql);
    return result.rows;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}

// Generate natural language response
function generateResponse(userQuery, sqlQuery, queryResults) {
  const resultsCount = queryResults.length;
  
  if (resultsCount === 0) {
    return `I couldn't find any data matching your query "${userQuery}". The SQL query executed was: ${sqlQuery}`;
  }
  
  if (userQuery.toLowerCase().includes("all available floats")) {
    return `I found ${resultsCount} unique floats in the database. Here are the platform IDs: ${queryResults.map(r => r.platform_id).join(', ')}`;
  }
  
  if (userQuery.toLowerCase().includes("latest location")) {
    const result = queryResults[0];
    return `The latest location for float ${result.platform_id} is at coordinates ${result.latitude}°N, ${result.longitude}°E.`;
  }
  
  if (userQuery.toLowerCase().includes("average temperature")) {
    const result = queryResults[0];
    return `The average temperature for float 1900816 is ${result.avg_temp?.toFixed(2)}°C.`;
  }
  
  if (userQuery.toLowerCase().includes("temperature range")) {
    const result = queryResults[0];
    return `Temperature statistics across all floats: Minimum: ${result.min_temp?.toFixed(2)}°C, Maximum: ${result.max_temp?.toFixed(2)}°C, Average: ${result.avg_temp?.toFixed(2)}°C.`;
  }
  
  if (userQuery.toLowerCase().includes("highest salinity")) {
    return `Here are the floats with the highest salinity measurements: ${queryResults.map(r => `Float ${r.platform_id}: ${r.max_salinity?.toFixed(2)} PSU`).join(', ')}`;
  }
  
  if (userQuery.toLowerCase().includes("deepest pressure")) {
    return `Here are the floats with the deepest pressure measurements: ${queryResults.map(r => `Float ${r.platform_id}: ${r.max_pressure?.toFixed(2)} dbar`).join(', ')}`;
  }
  
  // Default response
  return `I found ${resultsCount} results for your query "${userQuery}". Here's a sample of the data:`;
}

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("User query:", message);

    // Generate SQL from natural language
    const sqlQuery = generateSQL(message);
    console.log("Generated SQL:", sqlQuery);

    // Execute the SQL query
    const queryResults = await executeQuery(sqlQuery);
    console.log("Query results:", queryResults.length, "rows");

    // Generate natural language response
    const response = generateResponse(message, sqlQuery, queryResults);

    res.json({
      response: response,
      sqlQuery: sqlQuery,
      resultsCount: queryResults.length,
      data: queryResults.slice(0, 50) // Limit data in response
    });

  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ 
      error: "Failed to process chat message",
      details: error.message 
    });
  }
});

// Get sample queries
app.get("/api/sample-queries", (req, res) => {
  res.json({ sampleQueries });
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ 
      status: "healthy", 
      database: "connected"
    });
  } catch (error) {
    res.status(500).json({ 
      status: "unhealthy", 
      error: error.message 
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

const PORT = 5002;
app.listen(PORT, () => {
  console.log(`🤖 Simple RAG Chatbot service running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME || "postgres"}`);
});


