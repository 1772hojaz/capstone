import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import recommendationsReducer from './recommendationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    recommendations: recommendationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
