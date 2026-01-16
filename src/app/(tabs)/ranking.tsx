import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import { api, UserData, DailyBonusData } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Input } from '@/components/ui';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';

type SortBy = 'xp' | 'level' | 'messages' | 'prestige';

const sortOptions: { value: SortBy; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { value: 'xp', label: 'XP', icon: 'trending-up' },
  { value: 'level', label: 'Nível', icon: 'award' },
  { value: 'messages', label: 'Msgs', icon: 'message-square' },
  { value: 'prestige', label: 'Prestígio', icon: 'star' },
];

export default function RankingScreen() {
  const { colors } = useTheme();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [dailyBonus, setDailyBonus] = useState<DailyBonusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('xp');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...users];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.pushName?.toLowerCase().includes(searchLower) ||
          user.customName?.toLowerCase().includes(searchLower) ||
          user.id?.includes(search)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'level':
          return b.level - a.level || b.xp - a.xp;
        case 'messages':
          return b.totalMessages - a.totalMessages;
        case 'prestige':
          return b.prestige - a.prestige || b.level - a.level;
        default:
          return b.xp - a.xp;
      }
    });

    setFilteredUsers(filtered);
  }, [users, search, sortBy]);

  const loadData = async () => {
    try {
      const [usersResponse, bonusResponse] = await Promise.all([
        api.users.list(),
        api.dailyBonus.get(),
      ]);

      if (usersResponse.success && usersResponse.users) {
        const validUsers = usersResponse.users.filter(
          (u) => u.id?.includes('@s.whatsapp.net') && !u.id?.includes('@g.us')
        );
        setUsers(validUsers);
      }

      if (bonusResponse.success && bonusResponse.dailyBonus) {
        setDailyBonus(bonusResponse.dailyBonus);
      }
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o ranking.',
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

  const getRankIcon = (index: number) => {
    if (index === 0) return <Feather name="award" size={20} color="#f59e0b" />;
    if (index === 1) return <Feather name="award" size={20} color="#9ca3af" />;
    if (index === 2) return <Feather name="award" size={20} color="#b45309" />;
    return (
      <Text style={[styles.rankNumber, { color: colors.mutedForeground }]}>{index + 1}</Text>
    );
  };

  const getUserName = (user: UserData) => {
    if (user.customNameEnabled && user.customName) return user.customName;
    return user.pushName || 'Usuário';
  };

  const getBonusUserName = () => {
    if (!dailyBonus?.lastBonusUser) return 'Nenhum';
    const user = users.find((u) => u.id === dailyBonus.lastBonusUser);
    if (user) return getUserName(user);
    return dailyBonus.lastBonusUser.replace('@s.whatsapp.net', '');
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return dateString;
    }
  };

  const getValue = (user: UserData) => {
    switch (sortBy) {
      case 'messages':
        return user.totalMessages.toLocaleString();
      case 'prestige':
        return user.prestige.toString();
      case 'level':
        return user.level.toString();
      default:
        return user.xp.toLocaleString();
    }
  };

  const getValueLabel = () => {
    switch (sortBy) {
      case 'messages':
        return 'msgs';
      case 'prestige':
        return 'prest.';
      case 'level':
        return 'nível';
      default:
        return 'XP';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderUserItem = ({ item, index }: { item: UserData; index: number }) => (
    <View
      style={[
        styles.userItem,
        {
          backgroundColor: index < 3 ? `${colors.primary}08` : 'transparent',
        },
      ]}
    >
      <View style={styles.rankIconContainer}>{getRankIcon(index)}</View>
      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>
            {getUserName(item)}
          </Text>
          {item.prestige > 0 && (
            <View style={[styles.prestigeBadge, { backgroundColor: `${colors.primary}20` }]}>
              <Text style={[styles.prestigeText, { color: colors.primary }]}>⭐{item.prestige}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.userStats, { color: colors.mutedForeground }]}>
          Nível {item.level} • {item.totalMessages.toLocaleString()} msgs
        </Text>
      </View>
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: colors.foreground }]}>{getValue(item)}</Text>
        <Text style={[styles.valueLabel, { color: colors.mutedForeground }]}>{getValueLabel()}</Text>
      </View>
    </View>
  );

  const ListHeader = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Ranking</Text>
        <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
          Veja quem são os mais ativos do grupo
        </Text>
      </View>

      {/* Daily Bonus Card */}
      {dailyBonus && (
        <Card style={[styles.bonusCard, { borderColor: `${colors.warning}30` }]}>
          <CardHeader style={styles.bonusHeader}>
            <View style={styles.cardTitleRow}>
              <Feather name="zap" size={20} color={colors.warning} />
              <CardTitle style={styles.cardTitleText}>Bônus Diário</CardTitle>
            </View>
            <CardDescription>O primeiro a mandar mensagem no dia ganha XP em dobro!</CardDescription>
          </CardHeader>
          <CardContent>
            <View style={styles.bonusInfo}>
              <View style={[styles.bonusItem, { backgroundColor: `${colors.background}80` }]}>
                <Feather name="calendar" size={16} color={colors.mutedForeground} />
                <View>
                  <Text style={[styles.bonusLabel, { color: colors.mutedForeground }]}>
                    Última data
                  </Text>
                  <Text style={[styles.bonusValue, { color: colors.foreground }]}>
                    {dailyBonus.lastBonusDate ? formatDate(dailyBonus.lastBonusDate) : 'Nunca'}
                  </Text>
                </View>
              </View>
              <View style={[styles.bonusItem, { backgroundColor: `${colors.background}80` }]}>
                <Feather name="user" size={16} color={colors.mutedForeground} />
                <View>
                  <Text style={[styles.bonusLabel, { color: colors.mutedForeground }]}>
                    Último ganhador
                  </Text>
                  <Text style={[styles.bonusValue, { color: colors.foreground }]}>
                    {getBonusUserName()}
                  </Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>
      )}

      {/* Search & Filters */}
      <Card>
        <CardContent style={styles.filtersContent}>
          <View style={styles.searchContainer}>
            <Feather
              name="search"
              size={16}
              color={colors.mutedForeground}
              style={styles.searchIcon}
            />
            <Input
              placeholder="Buscar por nome ou número..."
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortOptions}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortButton,
                  {
                    backgroundColor:
                      sortBy === option.value ? colors.primary : colors.secondary,
                  },
                ]}
                onPress={() => setSortBy(option.value)}
              >
                <Feather
                  name={option.icon}
                  size={14}
                  color={sortBy === option.value ? colors.primaryForeground : colors.secondaryForeground}
                />
                <Text
                  style={[
                    styles.sortButtonText,
                    {
                      color:
                        sortBy === option.value ? colors.primaryForeground : colors.secondaryForeground,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </CardContent>
      </Card>

      {/* Top 3 */}
      {filteredUsers.length >= 3 && !search && (
        <View style={styles.top3Container}>
          {[1, 0, 2].map((pos) => {
            const user = filteredUsers[pos];
            if (!user) return null;
            const isFirst = pos === 0;

            return (
              <Card
                key={user.id}
                style={[
                  styles.top3Card,
                  isFirst && styles.top3CardFirst,
                  isFirst && {
                    borderColor: `${colors.warning}50`,
                    shadowColor: colors.warning,
                  },
                ]}
              >
                <CardContent style={styles.top3Content}>
                  <View
                    style={[
                      styles.top3Icon,
                      {
                        backgroundColor:
                          isFirst
                            ? `${colors.warning}20`
                            : pos === 1
                            ? '#9ca3af20'
                            : '#b4530920',
                      },
                    ]}
                  >
                    {getRankIcon(pos)}
                  </View>
                  <Text
                    style={[styles.top3Name, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {getUserName(user)}
                  </Text>
                  {user.prestige > 0 && (
                    <Text style={[styles.top3Prestige, { color: colors.primary }]}>
                      ⭐ Prestígio {user.prestige}
                    </Text>
                  )}
                  <Text style={[styles.top3Value, { color: colors.primary }]}>
                    {getValue(user)}
                  </Text>
                  <Text style={[styles.top3ValueLabel, { color: colors.mutedForeground }]}>
                    {getValueLabel()}
                  </Text>
                </CardContent>
              </Card>
            );
          })}
        </View>
      )}

      {/* List Header */}
      <Card style={styles.listCard}>
        <CardHeader>
          <View style={styles.cardTitleRow}>
            <Feather name="award" size={20} color={colors.primary} />
            <CardTitle style={styles.cardTitleText}>Classificação Geral</CardTitle>
            <Text style={[styles.countText, { color: colors.mutedForeground }]}>
              ({filteredUsers.length} usuários)
            </Text>
          </View>
        </CardHeader>
      </Card>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id || ''}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="award" size={48} color={`${colors.mutedForeground}30`} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nenhum usuário encontrado
            </Text>
          </View>
        }
      />
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
  listContent: {
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
  bonusCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  bonusHeader: {
    paddingBottom: spacing.xs,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitleText: {
    fontSize: fontSize.lg,
  },
  bonusInfo: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bonusItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  bonusLabel: {
    fontSize: fontSize.xs,
  },
  bonusValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  filtersContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  searchContainer: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.md,
    top: 16,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 40,
  },
  sortOptions: {
    flexDirection: 'row',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
  },
  sortButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  top3Container: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  top3Card: {
    flex: 1,
  },
  top3CardFirst: {
    marginTop: -spacing.md,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  top3Content: {
    alignItems: 'center',
    padding: spacing.md,
  },
  top3Icon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  top3Name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  top3Prestige: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  top3Value: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    marginTop: spacing.sm,
  },
  top3ValueLabel: {
    fontSize: fontSize.xs,
  },
  listCard: {
    marginBottom: -spacing.md,
  },
  countText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    marginLeft: spacing.xs,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  rankIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    flexShrink: 1,
  },
  prestigeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  prestigeText: {
    fontSize: fontSize.xs,
  },
  userStats: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  valueLabel: {
    fontSize: fontSize.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyText: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
});
