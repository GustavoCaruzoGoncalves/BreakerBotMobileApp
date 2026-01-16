import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';

export default function VerifyScreen() {
  const { login, phoneNumber, requestCode, isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const { toast } = useToast();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (!phoneNumber) {
      router.replace('/login');
    }
  }, [phoneNumber]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every((d) => d) && index === 5) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (codeString?: string) => {
    const finalCode = codeString || code.join('');

    if (finalCode.length !== 6) {
      toast({
        title: 'Código incompleto',
        description: 'Digite os 6 dígitos do código.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const result = await login(finalCode);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso.',
        variant: 'success',
      });
      router.replace('/(tabs)');
    } else {
      toast({
        title: 'Erro',
        description: result.message,
        variant: 'destructive',
      });
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!phoneNumber || countdown > 0) return;

    setIsResending(true);
    const result = await requestCode(phoneNumber);
    setIsResending(false);

    if (result.success) {
      toast({
        title: 'Código reenviado!',
        description: 'Verifique seu WhatsApp.',
        variant: 'success',
      });
      setCountdown(60);
    } else {
      toast({
        title: 'Erro',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 13) {
      return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    }
    return phone;
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
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <View style={styles.backContent}>
              <Feather name="arrow-left" size={16} color={colors.foreground} />
              <Text style={[styles.backText, { color: colors.foreground }]}>Voltar</Text>
            </View>
          </Button>

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconWrapper, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="shield" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Verificação</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Digite o código enviado para
            </Text>
            <Text style={[styles.phone, { color: colors.foreground }]}>
              {formatPhone(phoneNumber)}
            </Text>
          </View>

          {/* Code Input */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.codeInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: digit ? colors.primary : colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={digit}
                onChangeText={(value) => handleChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                autoFocus={index === 0}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Submit Button */}
          <View style={styles.buttons}>
            <Button
              variant="glow"
              size="xl"
              onPress={() => handleSubmit()}
              loading={isLoading}
              disabled={isLoading || code.some((d) => !d)}
              style={styles.submitButton}
            >
              <View style={styles.buttonContent}>
                <Feather name="log-in" size={20} color={colors.primaryForeground} />
                <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                  Entrar
                </Text>
              </View>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onPress={handleResend}
              disabled={isResending || countdown > 0}
            >
              <Text style={[styles.resendText, { color: colors.mutedForeground }]}>
                {isResending
                  ? 'Reenviando...'
                  : countdown > 0
                  ? `Reenviar código em ${countdown}s`
                  : 'Reenviar código'}
              </Text>
            </Button>
          </View>
        </View>
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  backContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backText: {
    fontSize: fontSize.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconWrapper: {
    width: 64,
    height: 64,
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
  phone: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  buttons: {
    gap: spacing.md,
  },
  submitButton: {
    width: '100%',
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
  resendText: {
    fontSize: fontSize.sm,
  },
});
