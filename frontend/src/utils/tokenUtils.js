export const storeToken = (key, value) => {
  window.localStorage.setItem(key, value);
};

export const getStoredToken = (key) => {
  return window.localStorage.getItem(key);
};

export const clearStoredToken = (key) => {
  window.localStorage.removeItem(key);
};
