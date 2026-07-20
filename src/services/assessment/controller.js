import Joi from "joi";
import AssessmentRepository from "./repositories.js";
import UserRepository from "../auth/repositories.js";
import InvariantError from "../../exceptions/InvariantError.js";
import pool from '../../config/database.js';
import {
  calculateBMI,
  getBMIMedicalStatus,
  getFamilyHistoryPenalty,
} from "./healthCalculator.js";

export const assessmentProfileSchema = Joi.object({
  age: Joi.number().integer().min(18).max(120).required(),
  gender: Joi.number().valid(0, 1).required(),
  height: Joi.number().positive().required(),
  weight: Joi.number().positive().required(),
  activity_level: Joi.string()
    .valid(
      "working",
      "not_working",
      "freelance",
      "household",
      "retired",
      "student",
    )
    .required(), // snake_case
  family_history: Joi.array()
    .items(Joi.string().valid("hypertension", "diabetes", "heart_disease"))
    .default([]), // snake_case
});

class AssessmentController {
  async saveProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { error, value } = assessmentProfileSchema.validate(req.body);
      if (error) throw new InvariantError(error.details[0].message);

      const { age, gender, height, weight, activity_level, family_history } =
        value;

      await AssessmentRepository.saveProfile(userId, {
        age,
        gender,
        height,
        weight,
        activityLevel: activity_level,
      });

      const mappedDiseases = family_history.map((d) => {
        if (d === "hypertension") return "hipertensi";
        if (d === "heart_disease") return "jantung/kronis";
        return d;
      });
      await UserRepository.replaceFamilyDiseases(userId, mappedDiseases);

      return res.status(200).json({
        status: "success",
        message: "Data medis awal berhasil disimpan.",
      });
    } catch (error) {
      next(error);
    }
  }

  async getQuestions(req, res, next) {
    try {
      // === SKRIP DIAGNOSTIK MULAI ===
      const dbInfo = await pool.query('SELECT CURRENT_USER, CURRENT_DATABASE(), VERSION()');
      console.log(`\n[Diagnostic] Node.js terhubung sebagai User: "${dbInfo.rows[0].current_user}" pada Database: "${dbInfo.rows[0].current_database}"`);
      
      const qCount = await pool.query('SELECT COUNT(*) FROM assessment_questions');
      console.log(`[Diagnostic] Jumlah baris ditemukan di tabel assessment_questions: ${qCount.rows[0].count}`);
      
      const oCount = await pool.query('SELECT COUNT(*) FROM assessment_options');
      console.log(`[Diagnostic] Jumlah baris ditemukan di tabel assessment_options: ${oCount.rows[0].count}\n`);
      // === SKRIP DIAGNOSTIK SELESAI ===

      const questions = await AssessmentRepository.getQuestions();
      
      // Tambahkan baris log ini untuk melihat jumlah data yang berhasil ditarik Node.js
      console.log(`[Database Log] Jumlah pertanyaan yang berhasil ditarik: ${questions.length} baris.`);

      return res.status(200).json({
        status: "success",
        data: questions,
      });
    } catch (error) {
      next(error);
    }
  }

  async submitAssessment(req, res, next) {
    try {
      const userId = req.user.id;
      const { answers } = req.body;

      if (!Array.isArray(answers) || answers.length < 11) {
        throw new InvariantError("Jawaban kuesioner tidak lengkap.");
      }

      const fullProfile = await UserRepository.getCompleteUserProfile(userId);
      const { age, height, weight, activities } = fullProfile.profile;
      const familyDiseases = fullProfile.familyDiseases;

      const findScore = (id) =>
        answers.find((a) => a.question_id === id)?.score_weight || 0;

      const highBP = findScore(1);
      const heartDisease = findScore(2);
      const smoker = findScore(3);
      const hvyAlcohol = findScore(4);
      const physActivity = findScore(5);
      const fruits = findScore(6);
      const veggies = findScore(7);
      const noDocbc = findScore(8);
      const diffWalk = findScore(9);
      const mentHlthDays = findScore(10);
      const physHlthDays = findScore(11);

      const bmi = calculateBMI(weight, height);
      const bmiStatus = getBMIMedicalStatus(bmi);
      const bmiScore = bmiStatus.baseScore / 90;
      const familyPenalty = getFamilyHistoryPenalty(familyDiseases);

      const bar1Raw =
        (highBP +
          heartDisease +
          diffWalk +
          physHlthDays / 30 +
          bmiScore +
          familyPenalty) /
        5.2;
      const physical_health_score = Math.min(100, Math.round(bar1Raw * 100));

      const activeScore = physActivity === 1 ? 1 : 0;
      const fruitScore = fruits === 1 ? 1 : 0;
      const vegScore = veggies === 1 ? 1 : 0;
      const smokeScore = smoker === 0 ? 1 : 0;
      const alcoholScore = hvyAlcohol === 0 ? 1 : 0;

      const bar2Raw =
        (activeScore + fruitScore + vegScore + smokeScore + alcoholScore) / 5;
      const lifestyle_score = Math.round(bar2Raw * 100);

      const bar3Raw = (mentHlthDays / 30 + noDocbc) / 2;
      const mental_score = Math.round(bar3Raw * 100);

      const final_risk_score = Math.round(
        physical_health_score * 0.5 +
          (100 - lifestyle_score) * 0.3 +
          mental_score * 0.2,
      );

      const ai_explainer_text = `Tingkat risiko kesehatan fisik dan metabolik Anda berada di angka ${physical_health_score}%. Kepatuhan gaya hidup sehat Anda tercatat sebesar ${lifestyle_score}%. Kondisi mental dan akses medis menunjukkan hambatan sebesar ${mental_score}%. Model memprediksi risiko kumulatif PTM Anda adalah ${final_risk_score}%.`;

      await AssessmentRepository.saveAssessmentResult(userId, {
        finalRiskScore: final_risk_score,
        physicalHealthScore: physical_health_score,
        lifestyleScore: lifestyle_score,
        mentalScore: mental_score,
        aiExplainerText: ai_explainer_text,
      });

      return res.status(200).json({
        status: "success",
        data: {
          final_risk_score,
          physical_health_score,
          lifestyle_score,
          mental_score,
          ai_explainer_text,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AssessmentController();
