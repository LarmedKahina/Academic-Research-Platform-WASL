import api from './api';

export const getSavedProjects = () =>
  api.get('/api/saved-projects');

export const saveProject = (projectId: string) =>
  api.post(`/api/saved-projects/${projectId}`);

export const unsaveProject = (projectId: string) =>
  api.delete(`/api/saved-projects/${projectId}`);

export const checkSaved = (projectId: string) =>
  api.get(`/api/saved-projects/${projectId}/status`);
