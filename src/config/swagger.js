import swaggerJSDoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TreeHealthy API Documentation',
      version: '1.0.0',
      description: 'Dokumentasi RESTful API berskala enterprise untuk aplikasi kesehatan TreeHealthy.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Server Lokal (Development)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Masukkan token JWT Anda dalam format: Bearer <token>',
        },
      },
    },
  },
  // Memindai seluruh anotasi JSDoc di setiap file di dalam folder services secara dinamis
  apis: ['./src/services/**/*.js'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export default swaggerSpec;