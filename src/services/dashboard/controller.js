import DashboardRepository from './repositories.js';
import InvariantError from '../../exceptions/InvariantError.js';
import NotFoundError from '../../exceptions/NotFoundError.js';

class DashboardController {
  async generatePlan(req, res, next) {
    try {
      const userId = req.user.id;

      const latestAssessment = await DashboardRepository.getLatestAssessmentResult(userId);
      if (!latestAssessment) {
        throw new InvariantError('Anda harus menyelesaikan kuesioner assessment kesehatan terlebih dahulu.');
      }

      let activeProgram = await DashboardRepository.getActiveProgram(userId);
      if (!activeProgram) {
        activeProgram = await DashboardRepository.createDefaultProgram(userId, latestAssessment.id);
        await DashboardRepository.upsertTreeStatus(userId, 'healthy');
      }

      return res.status(201).json({
        status: 'success',
        message: 'Program rencana aksi sehat selama 7 hari berhasil diaktifkan.',
        data: {
          programId: activeProgram.id,
          currentWeek: activeProgram.current_week,
          currentDay: activeProgram.current_day,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentDashboard(req, res, next) {
    try {
      const userId = req.user.id;

      const program = await DashboardRepository.getActiveProgram(userId);
      if (!program) {
        throw new NotFoundError('Anda belum memiliki program sehat yang aktif.');
      }

      const assessment = await DashboardRepository.getLatestAssessmentResult(userId);
      const tree = await DashboardRepository.getTreeStatus(userId);

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
      // Membaca input snake_case
      const { satisfaction_rating, notes, current_week } = req.body; 

      const program = await DashboardRepository.getActiveProgram(userId);
      if (!program) {
        throw new NotFoundError('Program sehat aktif tidak ditemukan.');
      }

      const aiWeeklyInsight = `Gaya hidup sehat Anda di minggu ke-${current_week} menunjukkan kepatuhan yang baik. Rating kepuasan fisik Anda berada pada angka ${satisfaction_rating}/5. Tetap pertahankan hidrasi tubuh dan hindari makanan jenuh di siklus berikutnya!`;

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
        
        // Memanggil fungsi repositori baru, bukan pool secara langsung
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
}

export default new DashboardController();