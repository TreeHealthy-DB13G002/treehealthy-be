import express from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express'; // Impor UI Swagger
import swaggerSpec from './config/swagger.js'; // Impor konfigurasi Swagger
import errorHandler from './middlewares/errorHandler.js';
import userRouter from './services/users/routes.js';

dotenv.config();

const app = express();
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;

app.use(express.json());

// Jalur Endpoint untuk Akses Dokumentasi Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Jalur tes awal kesehatan server
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server TreeHealthy berjalan dengan baik.',
  });
});

app.use('/users', userRouter);

app.use(errorHandler);

app.listen(port, host, () => {
  console.log(`Server berjalan di http://${host}:${port}`);
  console.log(`Dokumentasi API tersedia di http://${host}:${port}/api-docs`);
});