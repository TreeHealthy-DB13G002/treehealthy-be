import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Impor pustaka CORS
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import errorHandler from './middlewares/errorHandler.js';

// Impor Rute Modular
import authRouter from './services/auth/routes.js';
import userRouter from './services/users/routes.js';

dotenv.config();

const app = express();
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;

// Integrasikan CORS secara aman
app.use(cors());

app.use(express.json());

// Endpoint Dokumentasi API Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Jalur tes awal kesehatan server
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server TreeHealthy berjalan dengan baik.',
  });
});

// Daftarkan modul rute ke aplikasi Express
app.use('/auth', authRouter);
app.use('/users', userRouter);

app.use(errorHandler);

app.listen(port, host, () => {
  console.log(`Server berjalan di http://${host}:${port}`);
  console.log(`Dokumentasi API Swagger tersedia di http://${host}:${port}/api-docs`);
});