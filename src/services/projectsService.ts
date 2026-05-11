import api from './api';

export const getProjects = (params?: object) =>
  api.get('/api/projects', { params });

export const getProject = (id: string) =>
  api.get(`/api/projects/${id}`);
