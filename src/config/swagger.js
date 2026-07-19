import swaggerJSDoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TreeHealthy API Documentation',
      version: '1.0.0',
      description: 'Dokumentasi RESTful API Modular untuk aplikasi kesehatan TreeHealthy.',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Server Lokal (Development)',
      },
    ],
    // Mengunci urutan folder dari atas ke bawah agar tersusun rapi di UI
    tags: [
      { name: 'Auth', description: 'Manajemen Pendaftaran Akun dan Hak Akses' },
      { name: 'Assessment', description: 'API Manajemen Data Fisik dan Kuesioner Medis' },
      { name: 'Dashboard', description: 'Checklist Harian CERDIK dan Siklus Mingguan' },
      { name: 'Journey Log', description: 'Arsip Rekam Jejak Mingguan dan Evaluasi' },
      { name: 'Analytics', description: 'Grafik Tren Risiko PTM dan Tingkat Kepatuhan' },
      { name: 'Settings', description: 'Manajemen Akun dan Pembaruan Profil' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Masukkan token JWT Anda (tanpa menyertakan kata Bearer).',
        },
      },
    },
  },
  apis: ['./src/services/**/*.js'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export default swaggerSpec;