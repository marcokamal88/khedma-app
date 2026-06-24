import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setLang, toggleLang } from '../store/locale.slice';
import { translations, t as translate } from '../locales';

export const useLocale = () => {
  const lang = useSelector((state: RootState) => state.locale.lang);
  const dispatch = useDispatch();
  const locale = translations[lang];

  return {
    lang,
    locale,
    t: (key: string) => translate(locale, key),
    setLang: (l: 'ar' | 'en') => dispatch(setLang(l)),
    toggleLang: () => dispatch(toggleLang()),
    isRTL: lang === 'ar',
  };
};
