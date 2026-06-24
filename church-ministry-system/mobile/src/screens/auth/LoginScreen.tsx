import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  I18nManager,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useLocale } from '../../hooks/useLocale';
import { AppInput, AppButton } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';

export default function LoginScreen({ navigation }: any) {
  const { login, isLoading } = useAuth();
  const { t, lang, toggleLang, isRTL } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoginError(null);
    try {
      await login({ email, password });
    } catch (err: any) {
      setLoginError(err?.message || t('auth.loginError'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.langRow}>
        <TouchableOpacity onPress={toggleLang} style={styles.langBtn} activeOpacity={0.7}>
          <Text style={styles.langBtnText}>{lang === 'ar' ? 'EN' : 'AR'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.appName}>{t('app.name')}</Text>
        <Text style={styles.tagline}>{t('app.tagline')}</Text>

        <View style={styles.form}>
          <Text style={styles.welcomeBack}>{t('auth.welcomeBack')}</Text>

          <AppInput
            placeholder={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <AppInput
            placeholder={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.forgotRow} activeOpacity={0.7}>
            <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>

          {loginError && <Text style={styles.errorText}>{loginError}</Text>}

          <AppButton
            title={t('auth.signIn')}
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            size="lg"
            style={styles.loginBtn}
          />
        </View>

        <Text style={styles.noAccount}>{t('auth.noAccount')}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  langRow: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
  },
  langBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  langBtnText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  appName: {
    ...typography.displayHero,
    color: colors.textPrimary,
    textAlign: isRTL ? 'right' : 'left',
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    textAlign: isRTL ? 'right' : 'left',
    marginBottom: spacing.xxxxl,
  },
  form: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    backgroundColor: colors.surface,
  },
  welcomeBack: {
    ...typography.subHeading,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: isRTL ? 'right' : 'left',
  },
  forgotRow: {
    alignSelf: isRTL ? 'flex-start' : 'flex-end',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  forgotText: {
    ...typography.caption,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  loginBtn: { marginTop: spacing.xs },
  noAccount: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
