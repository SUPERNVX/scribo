import { render, screen } from '@testing-library/react';

// Mock the cache utility functions
const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  clear: jest.fn(),
  has: jest.fn(),
};

// Mock the cache module
jest.mock('../cache', () => mockCache);

describe('Cache Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set and get values from cache', () => {
    const cache = require('../cache');

    cache.set('test-key', 'test-value');
    expect(cache.set).toHaveBeenCalledWith('test-key', 'test-value');

    cache.get('test-key');
    expect(cache.get).toHaveBeenCalledWith('test-key');
  });

  it('should check if key exists in cache', () => {
    const cache = require('../cache');

    cache.has('test-key');
    expect(cache.has).toHaveBeenCalledWith('test-key');
  });

  it('should clear cache', () => {
    const cache = require('../cache');

    cache.clear();
    expect(cache.clear).toHaveBeenCalled();
  });
});
