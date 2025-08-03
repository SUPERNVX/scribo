// Mock do storage para testes
const mockStorage = {
  data: {},
  
  getItem: jest.fn((key) => {
    return mockStorage.data[key] || null;
  }),
  
  setItem: jest.fn((key, value) => {
    mockStorage.data[key] = typeof value === 'string' ? value : JSON.stringify(value);
  }),
  
  removeItem: jest.fn((key) => {
    delete mockStorage.data[key];
  }),
  
  clear: jest.fn(() => {
    mockStorage.data = {};
  }),
  
  // Métodos específicos do nosso storage
  getToken: jest.fn(() => mockStorage.data.token || null),
  setToken: jest.fn((token) => { mockStorage.data.token = token; }),
  removeToken: jest.fn(() => { delete mockStorage.data.token; }),
  
  getUser: jest.fn(() => {
    const user = mockStorage.data.user;
    return user ? JSON.parse(user) : null;
  }),
  setUser: jest.fn((user) => { 
    mockStorage.data.user = JSON.stringify(user); 
  }),
  removeUser: jest.fn(() => { delete mockStorage.data.user; }),
  
  // Reset para testes
  __reset: () => {
    mockStorage.data = {};
    jest.clearAllMocks();
  }
};

export const storage = mockStorage;
export default mockStorage;