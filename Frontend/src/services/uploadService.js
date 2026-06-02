import api from './api';

export const uploadAvatar = async (file) => {
  const form = new FormData();
  form.append('avatar', file);
  const res = await api.post('/upload/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deleteAvatar = async () => {
  const res = await api.delete('/upload/avatar');
  return res.data;
};

export const uploadDocument = async (file) => {
  const form = new FormData();
  form.append('document', file);
  const res = await api.post('/upload/document', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deleteDocument = async (docId) => {
  const res = await api.delete(`/upload/document/${docId}`);
  return res.data;
};
