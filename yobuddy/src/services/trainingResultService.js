import http from "./http";

const trainingResultService = {
  async getTrainingResultList({page = 0, size = 10}) {
    try {
      const resp = await http.get('/api/v1/admin/trainings/results', {params: {page, size}});

			return resp.data || [];

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