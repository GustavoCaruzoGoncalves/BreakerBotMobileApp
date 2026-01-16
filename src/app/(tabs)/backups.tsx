import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import { api, BackupUser } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Button } from '@/components/ui';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';

export default function BackupsScreen() {
  const { colors } = useTheme();
  const { toast } = useToast();
  const [backups, setBackups] = useState<BackupUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const response = await api.backup.list();
      if (response.success && response.backups) {
        setBackups(response.backups);
      }
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os backups.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadBackups();
    setIsRefreshing(false);
  };

  const handleRestore = async (userId: string) => {
    setRestoringId(userId);
    try {
      const response = await api.backup.restore(userId);
      if (response.success) {
        toast({
          title: 'Usuário restaurado!',
          description: 'O usuário foi restaurado com sucesso.',
          variant: 'success',
        });
        loadBackups();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível restaurar o usuário.',
        variant: 'destructive',
      });
    }
    setRestoringId(null);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const getUserName = (backup: BackupUser) => {
    if (backup.data.customNameEnabled && backup.data.customName) {
      return backup.data.customName;
    }
    return backup.data.pushName || 'Usuário';
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
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Backups</Text>
          <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
            Usuários deletados que podem ser restaurados
          </Text>
        </View>

        {/* Info Card */}
        <Card style={[styles.warningCard, { borderColor: `${colors.warning}30` }]}>
          <CardContent style={styles.warningContent}>
            <Feather name="alert-triangle" size={20} color={colors.warning} />
            <View style={styles.warningInfo}>
              <Text style={[styles.warningTitle, { color: colors.foreground }]}>
                Backup automático por 30 dias
              </Text>
              <Text style={[styles.warningDesc, { color: colors.mutedForeground }]}>
                Quando um usuário é deletado, seus dados são mantidos por 30 dias. Após esse
                período, os dados são removidos permanentemente.
              </Text>
            </View>
          </CardContent>
        </Card>

        {backups.length === 0 ? (
          <Card>
            <CardContent style={styles.emptyContent}>
              <Feather name="archive" size={64} color={`${colors.mutedForeground}30`} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Nenhum backup disponível
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                Não há usuários deletados para restaurar no momento.
              </Text>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <View style={styles.cardTitleRow}>
                  <Feather name="archive" size={20} color={colors.primary} />
                  <CardTitle style={styles.cardTitleText}>Usuários Deletados</CardTitle>
                  <Text style={[styles.countText, { color: colors.mutedForeground }]}>
                    ({backups.length})
                  </Text>
                </View>
                <CardDescription>
                  Clique em restaurar para recuperar os dados do usuário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <View style={styles.backupsList}>
                  {backups.map((backup) => {
                    const daysRemaining = getDaysRemaining(backup.expiresAt);
                    const isExpiringSoon = daysRemaining <= 7;

                    return (
                      <View
                        key={backup.id}
                        style={[styles.backupItem, { backgroundColor: `${colors.secondary}50` }]}
                      >
                        <View style={styles.backupMain}>
                          <View
                            style={[styles.backupIcon, { backgroundColor: `${colors.destructive}15` }]}
                          >
                            <Feather name="trash-2" size={20} color={colors.destructive} />
                          </View>
                          <View style={styles.backupInfo}>
                            <Text
                              style={[styles.backupName, { color: colors.foreground }]}
                              numberOfLines={1}
                            >
                              {getUserName(backup)}
                            </Text>
                            <Text style={[styles.backupId, { color: colors.mutedForeground }]}>
                              {backup.id.replace('@s.whatsapp.net', '')}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.backupMeta}>
                          <View style={styles.metaItem}>
                            <Feather name="clock" size={12} color={colors.mutedForeground} />
                            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                              Deletado: {formatDate(backup.deletedAt)}
                            </Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Feather
                              name="alert-triangle"
                              size={12}
                              color={isExpiringSoon ? colors.warning : colors.mutedForeground}
                            />
                            <Text
                              style={[
                                styles.metaText,
                                { color: isExpiringSoon ? colors.warning : colors.mutedForeground },
                              ]}
                            >
                              {daysRemaining} dias restantes
                            </Text>
                          </View>
                        </View>

                        <Button
                          size="sm"
                          onPress={() => handleRestore(backup.id)}
                          disabled={restoringId === backup.id}
                          style={styles.restoreButton}
                        >
                          {restoringId === backup.id ? (
                            <ActivityIndicator size="small" color={colors.primaryForeground} />
                          ) : (
                            <View style={styles.buttonContent}>
                              <Feather name="rotate-ccw" size={14} color={colors.primaryForeground} />
                              <Text style={{ color: colors.primaryForeground, fontSize: fontSize.sm }}>
                                Restaurar
                              </Text>
                            </View>
                          )}
                        </Button>
                      </View>
                    );
                  })}
                </View>
              </CardContent>
            </Card>

            {/* Stats */}
            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <CardContent style={styles.statContent}>
                  <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
                    <Feather name="archive" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {backups.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    Total de backups
                  </Text>
                </CardContent>
              </Card>
              <Card style={styles.statCard}>
                <CardContent style={styles.statContent}>
                  <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
                    <Feather name="alert-triangle" size={20} color={colors.warning} />
                  </View>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {backups.filter((b) => getDaysRemaining(b.expiresAt) <= 7).length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    Expirando em breve
                  </Text>
                </CardContent>
              </Card>
            </View>
          </>
        )}
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
  warningCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
  },
  warningInfo: {
    flex: 1,
  },
  warningTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  warningDesc: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitleText: {
    fontSize: fontSize.lg,
  },
  countText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
  },
  backupsList: {
    gap: spacing.md,
  },
  backupItem: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  backupMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backupIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backupInfo: {
    flex: 1,
  },
  backupName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  backupId: {
    fontSize: fontSize.xs,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  backupMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.xs,
  },
  restoreButton: {
    alignSelf: 'flex-start',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
