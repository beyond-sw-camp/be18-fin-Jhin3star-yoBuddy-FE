import http from './http';

export const getDepartments = (name) => {
  return http.get('/api/v1/admin/departments', {
    params: { name }
  });
};

export const getDepartmentById = (departmentId) => {
  return http.get(`/api/v1/admin/departments/${departmentId}`)
};