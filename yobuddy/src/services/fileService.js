import http from './http';

const fileService = {
  async uploadFiles(files, fileType, refType, refId) {
    try {
      const formData = new FormData();

      files.forEach(file => {
        formData.append('file', file);
      });

      if (fileType) formData.append("fileType", fileType);
      if (refType) formData.append("refType", refType);
      if (refId) formData.append("refId", refId);

      const resp = await http.post('/api/v1/files/upload', formData);
      return resp.data || [];
    } catch (e) {
      console.error("첨부파일 업로드 실패", e);
      throw e;
    }
  },

  async downloadFiles(fileId, fileNameFromList) {
    try {
      const response = await http.get(`/api/v1/files/download/${fileId}`, {
        responseType: 'blob', // 꼭 필요!
      });
      
      // 백엔드에서 내려준 파일이름 헤더
      let filename = fileNameFromList || 'file-download';

      // 2. 백엔드에서 Content-Disposition 헤더가 오면 그걸로 한 번 더 덮어쓰기 (옵션)
      const disposition =
        response.headers['content-disposition'] ||
        response.headers['Content-Disposition'];

      if (disposition) {
        const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/);
        if (match && match[1]) {
          try {
            filename = decodeURIComponent(match[1]);
          } catch (e) {
            filename = match[1];
          }
        }
      }

      // 파일 다운로드 처리
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('파일 다운로드 실패', e);
      throw e;
    }
  },
};

export default fileService;