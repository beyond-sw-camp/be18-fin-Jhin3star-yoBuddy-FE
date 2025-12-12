import http from "./http";

const trainingResultService = {
  async getTrainingResultList({
    page = 0, 
    size = 10,
    trainingName = null,
    onboardingName = null,
    userName = null,
  }) {
    try {
      const params = {
        page,
        size,
      };

      if (trainingName) params.trainingName = trainingName;
      if (onboardingName) params.onboardingName = onboardingName;
      if (userName) params.userName = userName;
      
      const resp = await http.get('/api/v1/admin/trainings/results', { params });

			return resp.data;

    } catch (e) {
      console.error("교육 평가 조회 실패", e);
      throw e;
    }
  },

	async deleteTrainingResult(trainingResultId) {
		try{
		const resp = await http.delete(`/api/v1/admin/trainings/results/${trainingResultId}`);

		return resp.data;
		} catch (e) {
      console.error("교육 평가 삭제 실패", e);
      throw e;
    }
	},

};

export default trainingResultService;