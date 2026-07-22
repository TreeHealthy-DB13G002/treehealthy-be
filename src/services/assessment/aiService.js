import axios from 'axios';

class AIService {
  constructor() {
    // Alamat URL server FastAPI milik tim Generative AI Anda
    this._aiBaseUrl = process.env.AI_SERVER_URL || 'http://localhost:8000'; 
  }

  // Fungsi untuk mengirim data jawaban kuesioner ke FastAPI
  async getAiRiskAnalysis(profileData, quizAnswers) {
    try {
      const response = await axios.post(`${this._aiBaseUrl}/api/predict`, {
        profile: profileData,
        answers: quizAnswers,
      });

      // Mengembalikan response data dari model ML & Gemini FastAPI
      return response.data; 
    } catch (error) {
      console.error('[AI Integration Error]: Gagal terhubung ke FastAPI.', error.message);
      // Fallback: mengembalikan null agar controller bisa menggunakan kalkulasi lokal cadangan jika server AI mati
      return null; 
    }
  }
}

export default new AIService();