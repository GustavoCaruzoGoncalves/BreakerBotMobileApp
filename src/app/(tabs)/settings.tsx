import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import { api, MentionsData, AdminData } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Switch } from '@/components/ui';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { toast } = useToast();
  const [mentions, setMentions] = useState<MentionsData | null>(null);
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [mentionsRes, adminsRes] = await Promise.all([
        api.mentions.get(),
        api.admins.list(),
      ]);

      if (mentionsRes.success) setMentions(mentionsRes.mentions || {});
      if (adminsRes.success) setAdmins(adminsRes.admins || []);
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleToggleGlobalMentions = async () => {
    if (!mentions) return;

    setIsSaving(true);
    try {
      const newValue = !mentions.globalEnabled;
      await api.mentions.update({ ...mentions, globalEnabled: newValue });
      setMentions({ ...mentions, globalEnabled: newValue });
      toast({
        title: newValue ? 'Menções ativadas' : 'Menções desativadas',
        description: newValue
          ? 'As menções globais foram ativadas.'
          : 'As menções globais foram desativadas.',
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar as configurações.',
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Configurações</Text>
          <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
            Configurações gerais do sistema (somente administradores)
          </Text>
        </View>

        {/* Global Mentions */}
        <Card>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <Feather name="globe" size={20} color={colors.primary} />
              <CardTitle style={styles.cardTitleText}>Menções Globais</CardTitle>
            </View>
            <CardDescription>
              Controla se o sistema de menções está ativo para todos os usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.foreground }]}>
                  Sistema de menções
                </Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>
                  Quando ativo, permite que usuários sejam mencionados no ranking
                </Text>
              </View>
              <Switch
                value={mentions?.globalEnabled ?? false}
                onValueChange={handleToggleGlobalMentions}
                disabled={isSaving}
              />
            </View>
          </CardContent>
        </Card>

        {/* Admins List */}
        <Card>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <Feather name="shield" size={20} color={colors.primary} />
              <CardTitle style={styles.cardTitleText}>Administradores</CardTitle>
            </View>
            <CardDescription>
              Usuários com permissões administrativas no bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            {admins.length > 0 ? (
              <View style={styles.adminsList}>
                {admins.map((admin, index) => (
                  <View
                    key={index}
                    style={[styles.adminItem, { backgroundColor: `${colors.secondary}50` }]}
                  >
                    <View style={[styles.adminIcon, { backgroundColor: `${colors.primary}15` }]}>
                      <Feather name="shield" size={16} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.adminNumber, { color: colors.foreground }]}>
                        +{admin.number}
                      </Text>
                      <Text style={[styles.adminLabel, { color: colors.mutedForeground }]}>
                        Administrador
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyAdmins}>
                <Feather name="shield" size={32} color={`${colors.mutedForeground}30`} />
                <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
                  Nenhum administrador configurado
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                  Configure a variável ADMINS no arquivo .env
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <Feather name="activity" size={20} color={colors.primary} />
              <CardTitle style={styles.cardTitleText}>Status do Sistema</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View
              style={[
                styles.statusBox,
                { backgroundColor: `${colors.success}10`, borderColor: `${colors.success}30` },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <View>
                <Text style={[styles.statusTitle, { color: colors.success }]}>Sistema Online</Text>
                <Text style={[styles.statusDesc, { color: colors.mutedForeground }]}>
                  API e Bot funcionando normalmente
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    marginBottom: spacing.sm,
  },
  pageTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  pageSubtitle: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitleText: {
    fontSize: fontSize.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  settingDesc: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  adminsList: {
    gap: spacing.sm,
  },
  adminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  adminIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminNumber: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    fontFamily: 'monospace',
  },
  adminLabel: {
    fontSize: fontSize.xs,
  },
  emptyAdmins: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  emptyDesc: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  statusDesc: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
