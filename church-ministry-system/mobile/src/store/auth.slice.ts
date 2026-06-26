import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ActiveContext {
  role: string;
  serviceId?: string;
  classId?: string;
  serviceName?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
  } | null;
  memberId: string | null;
  roles: string[];
  contexts: ActiveContext[];
  activeContext: ActiveContext | null;
  isLoading: boolean;
  needsContextSelection: boolean;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  memberId: null,
  roles: [],
  contexts: [],
  activeContext: null,
  isLoading: false,
  needsContextSelection: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{
      accessToken: string;
      refreshToken: string;
      user: any;
      memberId: string;
      roles: string[];
      contexts: any[];
      activeContext: any;
    }>) {
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.memberId = action.payload.memberId;
      state.roles = action.payload.roles;
      state.contexts = action.payload.contexts;
      state.activeContext = action.payload.activeContext;
      state.needsContextSelection = action.payload.contexts?.length > 1;
    },
    setContexts(state, action: PayloadAction<{
      roles: string[];
      contexts: any[];
      currentMemberId: string;
    }>) {
      state.roles = action.payload.roles;
      state.contexts = action.payload.contexts;
    },
    switchContext(state, action: PayloadAction<{
      accessToken: string;
      activeContext: any;
    }>) {
      state.token = action.payload.accessToken;
      state.activeContext = action.payload.activeContext;
      state.needsContextSelection = false;
    },
    logout(state) {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.memberId = null;
      state.roles = [];
      state.contexts = [];
      state.activeContext = null;
      state.needsContextSelection = false;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, setContexts, switchContext, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
