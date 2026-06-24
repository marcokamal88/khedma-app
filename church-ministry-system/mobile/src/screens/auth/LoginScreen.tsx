import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useLocale } from '../../hooks/useLocale';
import { AppInput, AppButton } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';

export default function LoginScreen({ navigation }: any) {
  const { login, isLoading } = useAuth();
  const { t, lang, toggleLang, isRTL } = useLocale();
  const styles = createStyles(isRTL);
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

  const loginTitle = isRTL ? `${t('auth.signIn')}  ←` : `←  ${t('auth.signIn')}`;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.langRow}>
        <TouchableOpacity onPress={toggleLang} style={styles.langBtn} activeOpacity={0.8}>
          <Text style={styles.langBtnText}>{lang === 'ar' ? 'EN' : 'AR'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.topBrand}>
        <View style={styles.logoWrap}>
          <MaterialCommunityIcons name={'church'} size={30} color={colors.charcoal} />
        </View>
        <Text style={styles.appName}>{t('app.name')}</Text>
        <Text style={styles.tagline}>{t('app.tagline')}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.form}>
          <Text style={styles.welcomeBack}>{t('auth.welcomeBack')}</Text>

          <AppInput
            placeholder={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={{ textAlign: isRTL ? 'right' : 'left' }}
            rightIcon={<Feather name={'mail'} size={18} color={colors.mutedGray} />}
          />
          <AppInput
            placeholder={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ textAlign: isRTL ? 'right' : 'left' }}
            rightIcon={<Feather name={'lock'} size={18} color={colors.mutedGray} />}
          />

          <TouchableOpacity style={styles.forgotRow} activeOpacity={0.7}>
            <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>

          {loginError && <Text style={styles.errorText}>{loginError}</Text>}

          <AppButton
            title={loginTitle}
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            size="lg"
            style={styles.loginBtn}
            textStyle={styles.loginBtnText}
          />
        </View>

        <Text style={styles.noAccount}>{t('auth.noAccount')}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(isRTL: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#192f5f' },
    langRow: {
      alignItems: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xxxl,
    },
    langBtn: {
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
    },
    langBtnText: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.offWhite,
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      width: '100%',
      flex: 1,
      paddingBottom: spacing.xxxl,
    },
    topBrand: {
      alignItems: 'center',
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xxl,
      width: '100%',
    },
    logoWrap: {
      width: 80,
      height: 80,
      borderRadius: 24,
      backgroundColor: '#f2c94c',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 18,
      elevation: 4,
    },
    appName: {
      ...typography.sectionHeading,
      color: colors.offWhite,
      textAlign: isRTL ? 'right' : 'left',
      marginBottom: spacing.xs,
    },
    tagline: {
      ...typography.caption,
      color: 'rgba(255,255,255,0.72)',
      letterSpacing: 0.3,
      textAlign: isRTL ? 'right' : 'left',
    },
    form: {
      width: '92%',
      alignSelf: 'center',
      borderRadius: 34,
      padding: spacing.xl,
      backgroundColor: colors.offWhite,
      marginTop: -32,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 6,
    },
    welcomeBack: {
      ...typography.subHeading,
      color: colors.charcoal,
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
      color: colors.mutedGray,
      textDecorationLine: 'underline',
    },
    errorText: {
      ...typography.caption,
      color: colors.error,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    loginBtn: {
      marginTop: spacing.sm,
      borderRadius: 28,
      backgroundColor: '#1f2d56',
      height: 56,
      justifyContent: 'center',
      width: '100%',
    },
    loginBtnText: {
      color: colors.offWhite,
      ...typography.button,
      letterSpacing: 0.6,
    },
    noAccount: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xl,
    },
  });
}

export { createStyles };
