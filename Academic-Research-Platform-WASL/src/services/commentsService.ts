import api from './api';

export const getComments = (projectId: string) =>
  api.get(`/api/projects/${projectId}/comments`);

export const addComment = (projectId: string, content: string) =>
  api.post(`/api/projects/${projectId}/comments`, { content });

export const updateComment = (commentId: string, content: string) =>
  api.put(`/api/comments/${commentId}`, { content });

export const deleteComment = (commentId: string) =>
  api.delete(`/api/comments/${commentId}`);
