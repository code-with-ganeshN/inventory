import app from './app';
import {pool} from "./config/db";
import { createTables } from './config/migrations';
import { initializeDatabase } from './config/seeds';

const PORT = process.env.PORT || 5000;

async function startDB(){
    await pool.query('select 1');
    console.log('Database connection successful');
    await createTables();
    await initializeDatabase();
}

startDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
