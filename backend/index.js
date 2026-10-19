import "dotenv/config";
import app from "./src/app.js";
import { pool, initDb } from "./src/config/db.js";

const PORT = process.env.PORT || 3777;

const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Db connected");
    connection.release();
    await initDb();
    app.listen(PORT, () => {
      console.log(`Server is running on port http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
