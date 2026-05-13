import api from './api';

export const getProjects = (params?: object) =>
  api.get('/api/projects', { params });

export const getProject = (id: string) =>
  api.get(`/api/projects/${id}`);

export const createProject = (data: {
  title: string;
  abstract: string;
  tags?: string[];
  university?: string;
  department?: string;
  project_type?: string;
}) =>
  api.post('/api/projects', data);

export const uploadProjectFile = (projectId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/api/projects/${projectId}/files`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
