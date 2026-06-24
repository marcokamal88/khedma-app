import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LocaleState {
  lang: 'ar' | 'en';
}

const initialState: LocaleState = {
  lang: 'ar',
};

const localeSlice = createSlice({
  name: 'locale',
  initialState,
  reducers: {
    setLang(state, action: PayloadAction<'ar' | 'en'>) {
      state.lang = action.payload;
    },
    toggleLang(state) {
      state.lang = state.lang === 'ar' ? 'en' : 'ar';
    },
  },
});

export const { setLang, toggleLang } = localeSlice.actions;
export default localeSlice.reducer;
