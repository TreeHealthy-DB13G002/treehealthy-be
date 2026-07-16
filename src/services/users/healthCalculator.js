// Aturan Konversi Umur (Halaman 2)
export const convertAgeToScale = (age) => {
  if (age >= 18 && age <= 24) return 1;
  if (age >= 25 && age <= 29) return 2;
  if (age >= 30 && age <= 34) return 3;
  if (age >= 35 && age <= 39) return 4;
  if (age >= 40 && age <= 44) return 5;
  if (age >= 45 && age <= 49) return 6;
  if (age >= 50 && age <= 54) return 7;
  if (age >= 55 && age <= 59) return 8;
  if (age >= 60 && age <= 64) return 9;
  if (age >= 65 && age <= 69) return 10;
  if (age >= 70 && age <= 74) return 11;
  if (age >= 75 && age <= 79) return 12;
  if (age >= 80) return 13;
  return 1; // Default fallback
};

// Aturan Range BMI (Halaman 1)
export const calculateBMI = (weight, height) => {
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return parseFloat(bmi.toFixed(1));
};

export const getBMIMedicalStatus = (bmi) => {
  if (bmi < 18.5) {
    return {
      classification: 'Berat Badan Kurang (Underweight)',
      riskEffect: 'Rendah, tapi rentang imun turun',
      baseScore: 15, // Skor dasar untuk kalkulasi risiko
    };
  }
  if (bmi >= 18.5 && bmi <= 22.9) {
    return {
      classification: 'Berat Badan Ideal (Normal)',
      riskEffect: 'Aman / Risiko Dasar',
      baseScore: 10,
    };
  }
  if (bmi >= 23.0 && bmi <= 24.9) {
    return {
      classification: 'Kelebihan Berat Badan (Overweight)',
      riskEffect: 'Waspada (Resistensi insulin mulai naik)',
      baseScore: 30,
    };
  }
  if (bmi >= 25.0 && bmi <= 29.9) {
    return {
      classification: 'Obesitas Tingkat I (Obese I)',
      riskEffect: 'Tinggi (Pemicu utama diabetes tipe 2)',
      baseScore: 60,
    };
  }
  return {
    classification: 'Obesitas Tingkat II (Obese II)',
    riskEffect: 'Sangat Tinggi / Kronis',
    baseScore: 90,
  };
};

// Aturan Daily Activities (Halaman 3)
export const getLifestylePenalty = (activity) => {
  switch (activity) {
    case 'working':
    case 'freelance':
      return { penalty: 0.0, score: 10 }; // +0% tambahan risiko
    case 'household':
    case 'student':
      return { penalty: 0.03, score: 40 }; // +3% tambahan risiko
    case 'not_working':
    case 'retired':
      return { penalty: 0.07, score: 80 }; // +7% tambahan risiko
    default:
      return { penalty: 0.0, score: 10 };
  }
};

// Aturan Riwayat PTM Keluarga (Halaman 4)
export const getFamilyHistoryPenalty = (diseasesArray) => {
  let totalPenalty = 0.0;
  
  if (diseasesArray.includes('diabetes')) {
    totalPenalty += 0.10; // +10%
  }
  if (diseasesArray.includes('hipertensi')) {
    totalPenalty += 0.05; // +5%
  }
  if (diseasesArray.includes('jantung/kronis')) {
    totalPenalty += 0.05; // +5%
  }

  return totalPenalty;
};

// Fungsi Agregasi Utama untuk Menghitung Skor Akhir Risiko
export const evaluateHealthRisk = ({ weight, height, age, activities, familyDiseases }) => {
  const bmi = calculateBMI(weight, height);
  const bmiStatus = getBMIMedicalStatus(bmi);
  const lifestyle = getLifestylePenalty(activities);
  const familyPenalty = getFamilyHistoryPenalty(familyDiseases);

  // Menentukan skor fisik berdasarkan BMI dan faktor usia (scale 1-13)
  const ageScale = convertAgeToScale(age);
  const physicalHealthScore = bmiStatus.baseScore + (ageScale * 2);

  // Gaya hidup berdasarkan kategori aktivitas fisik
  const lifestyleScore = lifestyle.score;

  // Mental score (default baseline, dapat dikembangkan dari fitur asessment kuesioner kelak)
  const mentalScore = 50; 

  // Kalkulasi Skor Risiko Akhir berdasarkan penalti persentase dari PDF
  // Rumus: Skor Dasar Fisik + Gaya Hidup + (Skor dasar dikali penalti aktivitas & penalti genetik keluarga)
  const penaltyMultiplier = 1.0 + lifestyle.penalty + familyPenalty;
  const finalRiskScore = Math.round((physicalHealthScore + lifestyleScore) * penaltyMultiplier);

  return {
    bmi,
    classification: bmiStatus.classification,
    riskEffect: bmiStatus.riskEffect,
    physicalHealthScore,
    lifestyleScore,
    mentalScore,
    finalRiskScore,
  };
};