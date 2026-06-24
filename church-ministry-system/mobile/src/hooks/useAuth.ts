import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setCredentials, switchContext, logout, setLoading } from '../store/auth.slice';
import { authApi } from '../api/auth.api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { token, user, memberId, roles, contexts, activeContext, isLoading } =
    useSelector((state: RootState) => state.auth);

  const login = useCallback(async (data: { email?: string; phone?: string; password: string }) => {
    console.log(`[useAuth] login() START | identifier: ${data.email || data.phone}`);
    dispatch(setLoading(true));
    try {
      console.log(`[useAuth] Calling authApi.login()`);
      const response: any = await authApi.login(data);
      console.log(`[useAuth] authApi.login() returned | response keys:`, Object.keys(response));
      
      const payload = response.data || response;
      console.log(`[useAuth] Payload extracted | has accessToken: ${!!payload.accessToken} | has refreshToken: ${!!payload.refreshToken} | user: ${payload.user?.fullName} | roles: ${payload.roles}`);

      console.log(`[useAuth] Saving tokens to AsyncStorage`);
      await AsyncStorage.setItem('access_token', payload.accessToken);
      await AsyncStorage.setItem('refresh_token', payload.refreshToken);
      console.log(`[useAuth] Tokens saved | dispatching setCredentials`);
      
      dispatch(setCredentials(payload));
      console.log(`[useAuth] login() SUCCESS | navigating to app`);
      return payload;
    } catch (err: any) {
      console.error(`[useAuth] login() FAILED | error:`, err?.message || err);
      throw err;
    } finally {
      dispatch(setLoading(false));
      console.log(`[useAuth] login() END`);
    }
  }, [dispatch]);

  const signup = useCallback(async (data: { fullName: string; email?: string; phone?: string; password: string }) => {
    dispatch(setLoading(true));
    try {
      const response: any = await authApi.signup(data);
      const payload = response.data || response;
      await AsyncStorage.setItem('access_token', payload.accessToken);
      await AsyncStorage.setItem('refresh_token', payload.refreshToken);
      dispatch(setCredentials(payload));
      return payload;
    } catch (err: any) {
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const fetchContexts = useCallback(async () => {
    const response: any = await authApi.getContexts();
    const payload = response.data || response;
    dispatch({ type: 'auth/setContexts', payload });
    return payload;
  }, [dispatch]);

  const doSwitchContext = useCallback(async (data: { role: string; serviceId?: string }) => {
    dispatch(setLoading(true));
    try {
      const response: any = await authApi.switchContext(data);
      const payload = response.data || response;
      await AsyncStorage.setItem('access_token', payload.accessToken);
      dispatch(switchContext(payload));
      return payload;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const doLogout = useCallback(async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    dispatch(logout());
  }, [dispatch]);

  const isAuthenticated = !!token;

  return {
    token, user, memberId, roles, contexts, activeContext, isLoading, isAuthenticated,
    login, signup, fetchContexts, switchContext: doSwitchContext, logout: doLogout,
  };
};
