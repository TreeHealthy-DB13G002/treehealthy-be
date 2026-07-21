import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import errorHandler from "./middlewares/errorHandler.js";

// Impor Semua Rute Modular Sesuai Aturan "output question.pdf"
import authRouter from "./services/auth/routes.js";
import assessmentRouter from "./services/assessment/routes.js";
import settingsRouter from "./services/settings/routes.js";
import dashboardRouter from "./services/dashboard/routes.js";
import analyticsRouter from "./services/analytics/routes.js";
import journeyLogRouter from "./services/journey-log/routes.js";

dotenv.config();

const app = express();
const host = process.env.HOST || "localhost";
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Jalur Swagger Docs dengan fitur mengunci token saat refresh halaman
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true, // Token JWT tidak akan hilang saat halaman di-refresh
    },
  }),
);

// Rute Sehat Sesuai Struktur Dokumen Kontrak Data & Gambar Dashboard Anda
app.use("/api/auth", authRouter);
app.use("/api/assessment", assessmentRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/journey-log", journeyLogRouter);

app.use(errorHandler);

app.listen(port, host, () => {
  console.log(`Server berjalan di http://${host}:${port}`);
  console.log(
    `Dokumentasi API Swagger interaktif tersedia di http://${host}:${port}/api-docs`,
  );
});
