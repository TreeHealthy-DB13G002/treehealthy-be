import ClientError from '../exceptions/ClientError.js';

const errorHandler = (err, req, res, next) => {
  if (err instanceof ClientError) {
    return res.status(err.statusCode).json({
      status: 'failed',
      message: err.message,
    });
  }

  // Menangani error dari database atau error sistem tak terduga lainnya
  console.error(err);
  return res.status(500).json({
    status: 'error',
    message: 'Terjadi kegagalan internal pada server kami.',
  });
};

export default errorHandler;