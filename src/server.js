import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import errorHandler from './middlewares/errorHandler.js';

// Impor rute-rute modular
import authRouter from './services/auth/routes.js';
import assessmentRouter from './services/assessment/routes.js';
import settingsRouter from './services/settings/routes.js';

dotenv.config();

const app = express();
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Setup Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Setup Prefix Rute Sesuai Spesifikasi Dokumen PDF
app.use('/api/auth', authRouter);
app.use('/api/assessment', assessmentRouter);
app.use('/api/settings', settingsRouter);

app.use(errorHandler);

app.listen(port, host, () => {
  console.log(`Server berjalan di http://${host}:${port}`);
  console.log(`Swagger dokumentasi di http://${host}:${port}/api-docs`);
});