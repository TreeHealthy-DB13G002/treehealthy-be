import express from 'express';
import dotenv from 'dotenv';
import errorHandler from './middlewares/errorHandler.js';
import userRouter from './services/users/routes.js'; // Impor rute user

dotenv.config();

const app = express();
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;

app.use(express.json());

// Jalur tes awal kesehatan server
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server TreeHealthy berjalan dengan baik.',
  });
});

// Daftarkan rute module user
app.use('/users', userRouter);

// Pemasangan Error Handler Terpusat di bagian akhir route
app.use(errorHandler);

app.listen(port, host, () => {
  console.log(`Server berjalan di http://${host}:${port}`);
});