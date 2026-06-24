import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useLocale } from '../../hooks/useLocale';
import { AppInput, AppButton } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';

export default function SignupScreen({ navigation }: any) {
  const { signup, isLoading } = useAuth();
  const { t, isRTL } = useLocale();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!fullName || (!email && !phone) || !password) return;
    setSignupError(null);
    try {
      await signup({ fullName, email: email || undefined, phone: phone || undefined, password });
    } catch (err: any) {
      setSignupError(err?.message || t('auth.signupError'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.appName}>{t('app.name')}</Text>
        <Text style={styles.tagline}>{t('app.tagline')}</Text>

        <View style={styles.form}>
          <Text style={styles.heading}>{t('auth.signupTitle')}</Text>
          <Text style={styles.subheading}>{t('auth.signupSubtitle')}</Text>

          <AppInput
            placeholder={t('auth.fullName')}
            value={fullName}
            onChangeText={setFullName}
          />
          <AppInput
            placeholder={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text style={styles.orText}>{t('auth.or')}</Text>
          <AppInput
            placeholder={t('auth.phonePlaceholder')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <AppInput
            placeholder={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {signupError && <Text style={styles.errorText}>{signupError}</Text>}

          <AppButton
            title={t('auth.signup')}
            onPress={handleSignup}
            loading={isLoading}
            disabled={isLoading}
            size="lg"
            style={styles.signupBtn}
          />
        </View>

        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>{t('auth.haveAccount')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
  },
  appName: {
    ...typography.displayHero,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xxxxl,
  },
  form: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    backgroundColor: colors.surface,
  },
  heading: {
    ...typography.subHeading,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  subheading: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  orText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  signupBtn: { marginTop: spacing.xs },
  linkRow: { marginTop: spacing.xxl, alignItems: 'center' },
  linkText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
