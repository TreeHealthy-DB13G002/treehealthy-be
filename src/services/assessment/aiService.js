import axios from 'axios';
import { calculateBMI } from './healthCalculator.js';

class AIService {
  constructor() {
    // Port default FastAPI kelompok Anda (biasanya berjalan di port 8000)
    this._aiBaseUrl = process.env.AI_SERVER_URL || 'http://localhost:8000';
  }

  async getAiRiskAnalysis(userProfile, rawAnswers) {
    try {
      // Pembantu untuk mencari nilai score_weight dari ID Pertanyaan tertentu
      const getAnswerWeight = (questionId) => {
        const ans = rawAnswers.find((a) => a.question_id === questionId);
        return ans ? ans.score_weight : 0;
      };

      const bmiValue = calculateBMI(userProfile.weight, userProfile.height);

      // =========================================================================
      // PEMETAAN DATA EXPRESS -> SCHEMAS PYDANTIC (HealthQuizInput) FASTAPI
      // =========================================================================
      const payload = {
        name: userProfile.fullname,
        age: parseInt(userProfile.age),
        gender: userProfile.gender === 'male' ? 'MALE' : 'FEMALE',
        bmi: bmiValue,
        
        // Konversi score_weight kuesioner biner ke Boolean (true jika skor 1)
        high_bp: getAnswerWeight(1) === 1,
        heart_disease: getAnswerWeight(2) === 1,
        smoker: getAnswerWeight(3) === 1,
        heavy_alcohol: getAnswerWeight(4) === 1,
        phys_activity: getAnswerWeight(5) === 1,
        fruits: getAnswerWeight(6) === 1,
        veggies: getAnswerWeight(7) === 1,
        no_doc_cost: getAnswerWeight(8) === 1,
        diff_walk: getAnswerWeight(9) === 1,
        
        // Membaca nilai hari langsung (Skala 0-30)
        ment_hlth: getAnswerWeight(10),
        phys_hlth: getAnswerWeight(11),
      };

      console.log('[Axios Request] Mengirim payload ke FastAPI:', payload);

      // Tembak endpoint POST FastAPI di "/scoring/quiz" (Halaman 15)
      const response = await axios.post(`${this._aiBaseUrl}/scoring/quiz`, payload);

      console.log('[Axios Response] Berhasil menerima data dari FastAPI:', response.data);
      return response.data;
    } catch (error) {
      console.error('[AI Integration Error]: Gagal menghubungi FastAPI. Detail:', error.message);
      // Mengembalikan null untuk memicu sistem cadangan (Fallback) jika server AI mati
      return null; 
    }
  }
}

export default new AIService();