import DashboardRepository from './repositories.js';
import NotFoundError from '../../exceptions/NotFoundError.js';

class DashboardController {
  async getCurrentDashboard(req, res, next) {
    try {
      const userId = req.user.id;

      let program = await DashboardRepository.getActiveProgram(userId);
      if (!program) {
        throw new NotFoundError('Anda belum memiliki program sehat yang aktif.');
      }

      // =========================================================================
      // LOGIKA PEMICU DETEKSI GANTI HARI OTOMATIS (DINAMIS BERDASARKAN REAL DATE)
      // =========================================================================
      const startDate = new Date(program.start_date);
      const today = new Date();
      
      // Hitung selisih hari kalender nyata dari tanggal start
      const diffTime = Math.abs(today - startDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // Menghasilkan Day 1, 2, dst.

      // Jika hari kalender nyata bertambah dan masih dalam siklus 7 hari, majukan Day secara otomatis
      if (diffDays > program.current_day && diffDays <= 7) {
        console.log(`[Dashboard - Auto Advance] Ganti hari terdeteksi secara otomatis dari Day ${program.current_day} ke Day ${diffDays}.`);
        program = await DashboardRepository.updateProgramProgress(userId, program.id, {
          currentDay: diffDays,
          streakDays: program.streak_days, // Streak dipertahankan sesuai kepatuhan tugas sebelumnya
          status: 'active',
        });
      }

      const assessment = await DashboardRepository.getLatestAssessmentResult(userId);
      const tree = await DashboardRepository.getTreeStatus(userId);

      // Ambil atau buat tugas harian baru untuk Day aktif terbaru
      const dailyChecklist = await DashboardRepository.getOrCreateTaskTrackers(
        userId,
        program.current_week,
        program.current_day
      );

      return res.status(200).json({
        status: 'success',
        data: {
          streakCount: program.streak_days,
          ptmRiskScore: assessment ? `${assessment.final_risk_score}%` : '0%',
          planDay: `Day ${program.current_day}`,
          dailyChecklist: dailyChecklist.map((task) => ({
            id: task.id,
            title: task.task_title,
            description: task.task_description,
            status: task.status,
          })),
          progressTree: tree ? tree.tree_status : 'healthy',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleTask(req, res, next) {
    try {
      const userId = req.user.id;
      const { taskId } = req.params;

      const updatedTask = await DashboardRepository.toggleTaskStatus(userId, taskId);
      if (!updatedTask) {
        throw new NotFoundError('Tugas harian tidak ditemukan.');
      }

      const compliance = await DashboardRepository.getTodayCompliance(userId);
      const completionRate = (parseInt(compliance.completed) / parseInt(compliance.total)) * 100;

      let treeStatus = 'healthy';
      if (completionRate < 25) {
        treeStatus = 'dead';
      } else if (completionRate >= 25 && completionRate <= 60) {
        treeStatus = 'sick';
      }

      const updatedTree = await DashboardRepository.upsertTreeStatus(userId, treeStatus);

      const program = await DashboardRepository.getActiveProgram(userId);
      let streak = program.streak_days;
      if (completionRate === 100) {
        streak += 1;
        await DashboardRepository.updateProgramProgress(userId, program.id, {
          currentDay: program.current_day,
          streakDays: streak,
          status: 'active',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Status checklist harian berhasil diperbarui.',
        data: {
          taskId: updatedTask.id,
          status: updatedTask.status,
          progressTree: updatedTree.tree_status,
          streakCount: streak,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async completeCycle(req, res, next) {
    try {
      const userId = req.user.id;
      // KOREKSI: Hapus satisfaction_rating dari destrukturisasi req.body
      const { notes, current_week } = req.body; 

      const program = await DashboardRepository.getActiveProgram(userId);
      if (!program) {
        throw new NotFoundError('Program sehat aktif tidak ditemukan.');
      }

      // KOREKSI: Sesuaikan teks rekomendasi AI tanpa menyertakan rating kepuasan fisik
      const aiWeeklyInsight = `Gaya hidup sehat Anda di minggu ke-${current_week} menunjukkan kepatuhan yang baik. Tetap pertahankan hidrasi tubuh dan hindari makanan jenuh di siklus berikutnya!`;

      await DashboardRepository.saveWeeklyEvaluation(userId, {
        weekNumber: current_week,
        perfectDays: program.streak_days >= 7 ? 7 : program.streak_days,
        avgCompliance: 85, 
        reflection: notes,
        insight: aiWeeklyInsight,
      });

      if (current_week < 4) {
        await DashboardRepository.updateProgramProgress(userId, program.id, {
          currentDay: 1,
          streakDays: 0,
          status: 'active',
        });
        
        await DashboardRepository.incrementProgramWeek(userId, program.id);

        return res.status(200).json({
          status: 'success',
          message: 'Siklus mingguan berhasil diselesaikan. Dashboard telah di-reset ke minggu berikutnya.',
          data: {
            currentWeek: current_week + 1,
            triggerModal: 'next_week',
          },
        });
      } else {
        await DashboardRepository.updateProgramProgress(userId, program.id, {
          currentDay: 7,
          streakDays: program.streak_days,
          status: 'completed',
        });

        return res.status(200).json({
          status: 'success',
          message: 'Selamat! Anda telah merampungkan program sehat 4 minggu penuh.',
          data: {
            triggerModal: 'congratulations',
          },
        });
      }
    } catch (error) {
      next(error);
    }
  }

  async getWeeklyStats(req, res, next) {
    try {
      const userId = req.user.id;

      // Ambil program sehat aktif saat ini
      const program = await DashboardRepository.getActiveProgram(userId);
      if (!program) {
        throw new NotFoundError('Program sehat aktif tidak ditemukan.');
      }

      // Ambil seluruh tracker tugas milik user pada minggu aktif saat ini
      const trackers = await DashboardRepository.getWeeklyTrackers(userId, program.current_week);

      const total_tasks = trackers.length;
      const done_tasks = trackers.filter(t => t.status === 'completed').length;
      const avg_compliance = total_tasks > 0 ? Math.round((done_tasks / total_tasks) * 100) : 0;

      // --- LOGIKA KALKULASI PERFECT DAYS (Hari Sempurna 100% Checklist Selesai) ---
      // Kelompokkan total tugas dan tugas selesai berdasarkan hari (Day 1 s.d Day 7)
      const daysMap = {};
      trackers.forEach(t => {
        const day = t.assigned_day;
        if (!daysMap[day]) {
          daysMap[day] = { total: 0, completed: 0 };
        }
        daysMap[day].total += 1;
        if (t.status === 'completed') {
          daysMap[day].completed += 1;
        }
      });

      // Hitung berapa hari yang memiliki total tugas > 0 dan semuanya selesai 100%
      let perfect_days = 0;
      Object.values(daysMap).forEach(d => {
        if (d.total > 0 && d.total === d.completed) {
          perfect_days += 1;
        }
      });

      return res.status(200).json({
        status: 'success',
        message: 'Berhasil mengambil statistik evaluasi mingguan',
        data: {
          avg_compliance,
          perfect_days,
          done_tasks,
          total_tasks
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DashboardController();