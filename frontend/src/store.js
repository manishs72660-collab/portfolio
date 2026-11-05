import { configureStore, createSlice } from '@reduxjs/toolkit';

const apiCacheSlice = createSlice({
  name: 'apiCache',
  initialState: { entries: {} },
  reducers: {
    cacheResponse(state, { payload: { key, data } }) {
      state.entries[key] = data;
    },
    invalidateCache(state, { payload: prefix }) {
      for (const key of Object.keys(state.entries)) {
        if (key === prefix || key.startsWith(`${prefix}/`) || key.startsWith(`${prefix}?`)) {
          delete state.entries[key];
        }
      }
    },
  },
});

export const store = configureStore({
  reducer: { apiCache: apiCacheSlice.reducer },
});

export const cacheResponse = apiCacheSlice.actions.cacheResponse;
export const invalidateCache = apiCacheSlice.actions.invalidateCache;
