import api from './api';

export const getDuties = async () => {
  const response = await api.get('/duties');
  return response.data;
};

export const getDuty = async (id) => {
  const response = await api.get(`/duties/${id}`);
  return response.data;
};

export const createDuty = async (dutyData) => {
  const response = await api.post('/duties', dutyData);
  return response.data;
};

export const updateDuty = async (id, dutyData) => {
  const response = await api.put(`/duties/${id}`, dutyData);
  return response.data;
};

export const deleteDuty = async (id) => {
  const response = await api.delete(`/duties/${id}`);
  return response.data;
};