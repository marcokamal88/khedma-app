import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth.slice';
import churchReducer from './church.slice';
import notificationsReducer from './notifications.slice';
import localeReducer from './locale.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    church: churchReducer,
    notifications: notificationsReducer,
    locale: localeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
