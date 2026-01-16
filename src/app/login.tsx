import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import { Button, Input } from '@/components/ui';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';

export default function LoginScreen() {
  const { requestCode } = useAuth();
  const { colors } = useTheme();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, '');
    const formatted = cleaned.startsWith('+')
      ? '+' + cleaned.slice(1).replace(/\+/g, '')
      : cleaned.replace(/\+/g, '');
    setPhoneNumber(formatted);
  };

  const handleSubmit = async () => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    if (cleanNumber.length < 10 || cleanNumber.length > 15) {
      toast({
        title: 'Número inválido',
        description: 'Digite o número completo com código do país.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const result = await requestCode(cleanNumber);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Código enviado!',
        description: 'Verifique seu WhatsApp para obter o código.',
        variant: 'success',
      });
      router.push('/verify');
    } else {
      toast({
        title: 'Erro',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Background decoration */}
        <View style={[styles.bgCircle1, { backgroundColor: `${colors.primary}15` }]} />
        <View style={[styles.bgCircle2, { backgroundColor: `${colors.primary}10` }]} />

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoWrapper, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="zap" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>BreakerBot</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Painel de Gerenciamento
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Feather name="phone" size={16} color={colors.mutedForeground} />
                <Text style={[styles.label, { color: colors.foreground }]}>
                  Seu número do WhatsApp
                </Text>
              </View>
              <Input
                placeholder="5516999999999"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={18}
                autoFocus
              />
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                Código do país + DDD + número. Ex: 5516999999999
              </Text>
            </View>

            <Button
              variant="glow"
              size="xl"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            >
              <View style={styles.buttonContent}>
                <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                  Receber código
                </Text>
                <Feather name="arrow-right" size={20} color={colors.primaryForeground} />
              </View>
            </Button>
          </View>
        </View>

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          Você precisa estar registrado no bot para acessar
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  bgCircle1: {
    position: 'absolute',
    top: '20%',
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  bgCircle2: {
    position: 'absolute',
    bottom: '20%',
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  card: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoWrapper: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.lg,
  },
  inputContainer: {
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  hint: {
    fontSize: fontSize.xs,
  },
  button: {
    marginTop: spacing.sm,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  buttonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  footer: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    marginTop: spacing.lg,
  },
});
