import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChurchState {
  sectors: any[];
  services: any[];
  currentService: any | null;
  currentYear: any | null;
}

const initialState: ChurchState = {
  sectors: [],
  services: [],
  currentService: null,
  currentYear: null,
};

const churchSlice = createSlice({
  name: 'church',
  initialState,
  reducers: {
    setSectors(state, action: PayloadAction<any[]>) {
      state.sectors = action.payload;
    },
    setServices(state, action: PayloadAction<any[]>) {
      state.services = action.payload;
    },
    setCurrentService(state, action: PayloadAction<any>) {
      state.currentService = action.payload;
    },
    setCurrentYear(state, action: PayloadAction<any>) {
      state.currentYear = action.payload;
    },
  },
});

export const { setSectors, setServices, setCurrentService, setCurrentYear } = churchSlice.actions;
export default churchSlice.reducer;
