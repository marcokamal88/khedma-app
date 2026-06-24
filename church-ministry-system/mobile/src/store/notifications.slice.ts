import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NotificationsState {
  unreadCount: number;
  items: any[];
}

const initialState: NotificationsState = {
  unreadCount: 0,
  items: [],
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload;
    },
    setNotifications(state, action: PayloadAction<any[]>) {
      state.items = action.payload;
    },
    addNotification(state, action: PayloadAction<any>) {
      state.items.unshift(action.payload);
    },
    markAsRead(state, action: PayloadAction<string>) {
      const notif = state.items.find((n) => n.id === action.payload);
      if (notif) {
        notif.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead(state) {
      state.items.forEach((n) => (n.isRead = true));
      state.unreadCount = 0;
    },
  },
});

export const { setUnreadCount, setNotifications, addNotification, markAsRead, markAllAsRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;
