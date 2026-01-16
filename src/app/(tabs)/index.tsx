import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { Button, Input, Switch, Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';

const POPULAR_EMOJIS = ['❤️', '🔥', '😎', '🎉', '⭐', '💪', '🚀', '🌟', '💯', '🏆', '👑', '💎', '🦋', '🌈', '🐱', '🐶', '🦔', '🫏', '💀', '👻'];

interface StatCardProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string | number;
  subValue?: string;
}

function StatCard({ icon, label, value, subValue }: StatCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.statCard}>
      <CardContent style={styles.statContent}>
        <View style={styles.statInfo}>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
          {subValue && (
            <Text style={[styles.statSubValue, { color: colors.mutedForeground }]}>{subValue}</Text>
          )}
        </View>
        <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
          <Feather name={icon} size={20} color={colors.primary} />
        </View>
      </CardContent>
    </Card>
  );
}

export default function ProfileScreen() {
  const { user, userId, refreshUser, logout } = useAuth();
  const { colors, theme, setTheme, isDark } = useTheme();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [customName, setCustomName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingEmoji, setIsEditingEmoji] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');

  useEffect(() => {
    if (user) {
      setCustomName(user.customName || '');
      setCustomEmoji(user.emoji || '');
    }
  }, [user]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshUser();
    setIsRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleToggleMentions = async () => {
    if (!userId || !user) return;

    setIsSaving(true);
    try {
      await api.users.update(userId, {
        allowMentions: !user.allowMentions,
      });
      await refreshUser();
      toast({
        title: user.allowMentions ? 'Menções desativadas' : 'Menções ativadas',
        description: user.allowMentions
          ? 'Você não será mais mencionado no ranking.'
          : 'Agora você aparecerá nas menções do ranking.',
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

  const handleToggleCustomName = async () => {
    if (!userId || !user) return;

    setIsSaving(true);
    try {
      await api.users.update(userId, {
        customNameEnabled: !user.customNameEnabled,
      });
      await refreshUser();
      toast({
        title: user.customNameEnabled ? 'Nome personalizado desativado' : 'Nome personalizado ativado',
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

  const handleToggleEmojiReaction = async () => {
    if (!userId || !user) return;

    setIsSaving(true);
    try {
      await api.users.update(userId, {
        emojiReaction: !user.emojiReaction,
      });
      await refreshUser();
      toast({
        title: user.emojiReaction ? 'Reação de emoji desativada' : 'Reação de emoji ativada',
        description: user.emojiReaction
          ? 'O bot não vai mais reagir às suas mensagens.'
          : 'O bot vai reagir às suas mensagens com seu emoji.',
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

  const handleSaveEmoji = async (emoji?: string) => {
    if (!userId) return;

    const emojiToSave = emoji || customEmoji.trim();

    if (!emojiToSave) {
      toast({
        title: 'Emoji inválido',
        description: 'Por favor, selecione ou digite um emoji.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await api.users.update(userId, {
        emoji: emojiToSave,
      });
      await refreshUser();
      setIsEditingEmoji(false);
      setCustomEmoji(emojiToSave);
      toast({
        title: 'Emoji atualizado!',
        description: `Seu emoji de reação agora é ${emojiToSave}`,
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o emoji.',
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  const handleSaveName = async () => {
    if (!userId) return;

    if (customName.length > 30) {
      toast({
        title: 'Nome muito longo',
        description: 'O nome deve ter no máximo 30 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await api.users.update(userId, {
        customName: customName.trim() || null,
      });
      await refreshUser();
      setIsEditingName(false);
      toast({
        title: 'Nome atualizado!',
        description: 'Seu nome personalizado foi salvo.',
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o nome.',
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  const getProgressPercent = () => {
    if (!user) return 0;
    if (user.progressPercent !== undefined) {
      return user.progressPercent;
    }
    if (user.progressXP !== undefined && user.nextLevelXP !== undefined) {
      return Math.min(100, Math.round((user.progressXP / user.nextLevelXP) * 100));
    }
    return 0;
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  if (!user) {
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
          <View>
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>Meu Perfil</Text>
            <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
              Gerencie suas informações e preferências
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.secondary }]}
              onPress={cycleTheme}
            >
              <Feather
                name={theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'monitor'}
                size={20}
                color={colors.foreground}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.secondary }]}
              onPress={handleLogout}
            >
              <Feather name="log-out" size={20} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>

        {/* User Header Card */}
        <Card style={styles.userCard}>
          <CardContent style={styles.userContent}>
            <View style={styles.userRow}>
              <View style={[styles.avatar, { backgroundColor: `${colors.primary}15` }]}>
                <Feather name="user" size={32} color={colors.primary} />
              </View>
              <View style={styles.userInfo}>
                <View style={styles.userNameRow}>
                  <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>
                    {user.customNameEnabled && user.customName
                      ? user.customName
                      : user.pushName || 'Usuário'}
                  </Text>
                  {user.prestige > 0 && (
                    <View style={[styles.prestigeBadge, { backgroundColor: `${colors.primary}20` }]}>
                      <Text style={[styles.prestigeText, { color: colors.primary }]}>
                        ⭐ Prestígio {user.prestige}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.userId, { color: colors.mutedForeground }]}>
                  {userId?.replace('@s.whatsapp.net', '')}
                </Text>

                {/* Level Progress */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                      Nível {user.level}
                    </Text>
                    <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                      {(user.progressXP ?? 0).toLocaleString()} / {(user.nextLevelXP ?? 0).toLocaleString()} XP
                    </Text>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: colors.secondary }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { backgroundColor: colors.primary, width: `${getProgressPercent()}%` },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressHint, { color: colors.mutedForeground }]}>
                    XP Total: {user.xp.toLocaleString()} • Faltam {(user.neededXP ?? 0).toLocaleString()} XP
                  </Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="award"
            label="Nível"
            value={user.level}
            subValue={`${user.xp.toLocaleString()} XP total`}
          />
          <StatCard
            icon="star"
            label="Prestígio"
            value={user.prestige}
            subValue={user.prestigeAvailable > 0 ? `${user.prestigeAvailable} disponível` : undefined}
          />
          <StatCard
            icon="message-square"
            label="Mensagens"
            value={user.totalMessages.toLocaleString()}
          />
          <StatCard
            icon="zap"
            label="Bônus Diário"
            value={`${user.dailyBonusMultiplier}x`}
            subValue={user.dailyBonusExpiry ? 'Ativo' : 'Inativo'}
          />
        </View>

        {/* Custom Name Card */}
        <Card>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <Feather name="edit-3" size={20} color={colors.primary} />
              <CardTitle style={styles.cardTitleText}>Nome Personalizado</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.foreground }]}>
                  Usar nome personalizado
                </Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>
                  Substitui seu nome do WhatsApp no ranking
                </Text>
              </View>
              <Switch
                value={user.customNameEnabled}
                onValueChange={handleToggleCustomName}
                disabled={isSaving}
              />
            </View>

            {isEditingName ? (
              <View style={styles.editRow}>
                <Input
                  value={customName}
                  onChangeText={setCustomName}
                  placeholder="Seu nome personalizado"
                  maxLength={30}
                  style={styles.editInput}
                />
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveName}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <Feather name="check" size={20} color={colors.primaryForeground} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: colors.secondary }]}
                  onPress={() => {
                    setIsEditingName(false);
                    setCustomName(user.customName || '');
                  }}
                >
                  <Feather name="x" size={20} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            ) : (
              <Button variant="secondary" onPress={() => setIsEditingName(true)} style={styles.fullButton}>
                <View style={styles.buttonContent}>
                  <Feather name="edit-3" size={16} color={colors.secondaryForeground} />
                  <Text style={{ color: colors.secondaryForeground }}>
                    {user.customName ? 'Editar nome' : 'Definir nome'}
                  </Text>
                </View>
              </Button>
            )}

            {user.customName && !isEditingName && (
              <Text style={[styles.currentValue, { color: colors.mutedForeground }]}>
                Nome atual: <Text style={{ color: colors.foreground, fontWeight: '500' }}>{user.customName}</Text>
              </Text>
            )}
          </CardContent>
        </Card>

        {/* Mentions Card */}
        <Card>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <Feather
                name={user.allowMentions ? 'bell' : 'bell-off'}
                size={20}
                color={user.allowMentions ? colors.primary : colors.mutedForeground}
              />
              <CardTitle style={styles.cardTitleText}>Menções no Ranking</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.foreground }]}>
                  Permitir menções
                </Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>
                  Ser marcado quando aparecer no ranking
                </Text>
              </View>
              <Switch
                value={user.allowMentions}
                onValueChange={handleToggleMentions}
                disabled={isSaving}
              />
            </View>

            <View
              style={[
                styles.infoBox,
                { backgroundColor: user.allowMentions ? `${colors.primary}15` : colors.secondary },
              ]}
            >
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {user.allowMentions
                  ? '✓ Você será mencionado quando aparecer no ranking diário ou semanal.'
                  : '✗ Seu nome aparecerá no ranking, mas sem marcar você.'}
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Emoji Reaction Card */}
        <Card>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <Feather name="smile" size={20} color={colors.primary} />
              <CardTitle style={styles.cardTitleText}>Reação de Emoji</CardTitle>
            </View>
            <CardDescription>
              O bot vai reagir automaticamente a todas as suas mensagens com seu emoji escolhido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.foreground }]}>
                  Ativar reação automática
                </Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>
                  O bot reage a cada mensagem sua com o emoji
                </Text>
              </View>
              <Switch
                value={user.emojiReaction || false}
                onValueChange={handleToggleEmojiReaction}
                disabled={isSaving}
              />
            </View>

            <View style={styles.emojiSection}>
              <View style={styles.emojiHeader}>
                <Text style={[styles.settingTitle, { color: colors.foreground }]}>Seu emoji</Text>
                {user.emoji && !isEditingEmoji && (
                  <Text style={styles.currentEmoji}>{user.emoji}</Text>
                )}
              </View>

              {isEditingEmoji ? (
                <View style={styles.emojiEditor}>
                  <View style={styles.editRow}>
                    <Input
                      value={customEmoji}
                      onChangeText={setCustomEmoji}
                      placeholder="Digite ou cole um emoji"
                      maxLength={4}
                      style={[styles.editInput, styles.emojiInput]}
                    />
                    <TouchableOpacity
                      style={[styles.editButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleSaveEmoji()}
                      disabled={isSaving || !customEmoji.trim()}
                    >
                      {isSaving ? (
                        <ActivityIndicator size="small" color={colors.primaryForeground} />
                      ) : (
                        <Feather name="check" size={20} color={colors.primaryForeground} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editButton, { backgroundColor: colors.secondary }]}
                      onPress={() => {
                        setIsEditingEmoji(false);
                        setCustomEmoji(user.emoji || '');
                      }}
                    >
                      <Feather name="x" size={20} color={colors.foreground} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.emojiSuggestionLabel, { color: colors.mutedForeground }]}>
                    Sugestões:
                  </Text>
                  <View style={styles.emojiGrid}>
                    {POPULAR_EMOJIS.map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        style={[styles.emojiButton, { backgroundColor: `${colors.primary}10` }]}
                        onPress={() => handleSaveEmoji(emoji)}
                        disabled={isSaving}
                      >
                        <Text style={styles.emojiButtonText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <Button variant="secondary" onPress={() => setIsEditingEmoji(true)} style={styles.fullButton}>
                  <View style={styles.buttonContent}>
                    <Feather name="smile" size={16} color={colors.secondaryForeground} />
                    <Text style={{ color: colors.secondaryForeground }}>
                      {user.emoji ? 'Trocar emoji' : 'Escolher emoji'}
                    </Text>
                  </View>
                </Button>
              )}
            </View>

            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor:
                    user.emojiReaction && user.emoji ? `${colors.primary}15` : colors.secondary,
                },
              ]}
            >
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {user.emojiReaction && user.emoji
                  ? `✓ O bot vai reagir às suas mensagens com ${user.emoji}`
                  : user.emoji
                  ? `✗ Reação desativada. Ative para o bot reagir com ${user.emoji}`
                  : '✗ Escolha um emoji e ative a reação para começar'}
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Badges Card */}
        <Card style={styles.lastCard}>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <Feather name="award" size={20} color={colors.primary} />
              <CardTitle style={styles.cardTitleText}>Conquistas</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            {user.badges.length > 0 ? (
              <View style={styles.badgesGrid}>
                {user.badges.map((badge, index) => (
                  <View
                    key={index}
                    style={[styles.badge, { backgroundColor: `${colors.primary}15` }]}
                  >
                    <Text style={[styles.badgeText, { color: colors.primary }]}>{badge}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyBadges}>
                <Feather name="award" size={48} color={`${colors.mutedForeground}30`} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Nenhuma conquista ainda. Continue participando!
                </Text>
              </View>
            )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    marginBottom: spacing.sm,
  },
  userContent: {
    padding: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  prestigeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  prestigeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  userId: {
    fontSize: fontSize.sm,
    fontFamily: 'monospace',
    marginTop: spacing.xs,
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: fontSize.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressHint: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
  },
  statContent: {
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
  },
  statSubValue: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: spacing.md,
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
  editRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  editInput: {
    flex: 1,
  },
  editButton: {
    width: 44,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullButton: {
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  currentValue: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  infoBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.sm,
  },
  emojiSection: {
    marginTop: spacing.sm,
  },
  emojiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  currentEmoji: {
    fontSize: 24,
  },
  emojiEditor: {
    gap: spacing.sm,
  },
  emojiInput: {
    textAlign: 'center',
    fontSize: fontSize.xl,
  },
  emojiSuggestionLabel: {
    fontSize: fontSize.xs,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  emojiButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiButtonText: {
    fontSize: 18,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  emptyBadges: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  lastCard: {
    marginBottom: spacing.xl,
  },
});
