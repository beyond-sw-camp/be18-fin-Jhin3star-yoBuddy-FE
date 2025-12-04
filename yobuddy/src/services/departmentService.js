import http from './http';

export const getDepartments = (name) => {
  return http.get('/api/v1/admin/departments', {
    params: { name }
  });
};

export const getDepartmentById = (departmentId) => {
  return http.get(`/api/v1/admin/departments/${departmentId}`)
};

export const createDepartment = (departmentRequest) => {
  return http.post('/api/v1/admin/departments', departmentRequest)
};

export const updateDepartment = (departmentId, departmentRequest) => {
  return http.patch(`/api/v1/admin/departments/${departmentId}`, departmentRequest)
};

export const deleteDepartment = (departmentId) => {
  return http.delete(`/api/v1/admin/departments/${departmentId}`)
};