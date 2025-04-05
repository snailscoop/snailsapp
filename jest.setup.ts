import '@testing-library/jest-dom';

// Mock CSS modules
jest.mock('*.module.css', () => {
  return new Proxy(
    {},
    {
      get: function getter(target, key) {
        return key;
      }
    }
  );
}); 