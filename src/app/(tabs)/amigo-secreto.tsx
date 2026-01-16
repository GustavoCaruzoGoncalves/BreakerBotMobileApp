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
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import { api, AmigoSecretoGroup, ParticipanteDetalhado } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '@/components/ui';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';

export default function AmigoSecretoScreen() {
  const { userId } = useAuth();
  const { colors } = useTheme();
  const { toast } = useToast();
  const [groups, setGroups] = useState<AmigoSecretoGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editingPresente, setEditingPresente] = useState<string | null>(null);
  const [presenteValue, setPresenteValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userId) {
      loadGroups();
    }
  }, [userId]);

  const loadGroups = async () => {
    if (!userId) return;

    try {
      const response = await api.amigoSecreto.getByUser(userId);
      if (response.success && response.groups) {
        setGroups(response.groups);
        if (response.groups.length > 0) {
          setExpandedGroups(new Set([response.groups[0].groupId]));
        }
      }
    } catch {
      setGroups([]);
    }
    setIsLoading(false);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadGroups();
    setIsRefreshing(false);
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) newExpanded.delete(groupId);
    else newExpanded.add(groupId);
    setExpandedGroups(newExpanded);
  };

  const filterParticipantes = (participantes: ParticipanteDetalhado[]) => {
    if (!search.trim()) return participantes;
    const searchLower = search.toLowerCase();
    return participantes.filter(
      (p) =>
        p.nome.toLowerCase().includes(searchLower) ||
        p.id.toLowerCase().includes(searchLower) ||
        (p.presente && p.presente.toLowerCase().includes(searchLower))
    );
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

  const startEditingPresente = (groupId: string, currentPresente: string | null) => {
    setEditingPresente(groupId);
    setPresenteValue(currentPresente || '');
  };

  const cancelEditingPresente = () => {
    setEditingPresente(null);
    setPresenteValue('');
  };

  const savePresente = async (groupId: string) => {
    if (!userId) return;

    setIsSaving(true);
    try {
      const response = await api.amigoSecreto.updatePresente(groupId, userId, presenteValue);

      if (response.success) {
        toast({
          title: 'Presente atualizado!',
          description: presenteValue ? `Seu presente desejado: ${presenteValue}` : 'Presente removido',
        });
        await loadGroups();
        setEditingPresente(null);
        setPresenteValue('');
      } else {
        toast({
          title: 'Erro',
          description: response.message || 'Não foi possível atualizar o presente',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o presente',
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
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Amigo Secreto</Text>
          <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
            Grupos de amigo secreto que você participa
          </Text>
        </View>

        {groups.length === 0 ? (
          <Card>
            <CardContent style={styles.emptyContent}>
              <Feather name="gift" size={64} color={`${colors.mutedForeground}30`} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Nenhum amigo secreto encontrado
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                Você não está participando de nenhum grupo de amigo secreto no momento. Use o
                comando no WhatsApp para criar ou participar de um!
              </Text>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Search */}
            <Card>
              <CardContent style={styles.searchContent}>
                <View style={styles.searchContainer}>
                  <Feather
                    name="search"
                    size={16}
                    color={colors.mutedForeground}
                    style={styles.searchIcon}
                  />
                  <Input
                    placeholder="Buscar por nome ou presente..."
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchInput}
                  />
                </View>
              </CardContent>
            </Card>

            {/* Groups */}
            {groups.map((group) => {
              const isExpanded = expandedGroups.has(group.groupId);
              const filteredParticipantes = filterParticipantes(group.participantes);

              return (
                <Card key={group.groupId}>
                  {/* Group Header */}
                  <TouchableOpacity
                    style={styles.groupHeader}
                    onPress={() => toggleGroup(group.groupId)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.groupHeaderContent}>
                      <View style={[styles.groupIcon, { backgroundColor: `${colors.primary}15` }]}>
                        <Feather name="gift" size={20} color={colors.primary} />
                      </View>
                      <View style={styles.groupInfo}>
                        <Text
                          style={[styles.groupName, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {group.groupName}
                        </Text>
                        <View style={styles.groupMeta}>
                          <View style={styles.groupMetaItem}>
                            <Feather name="users" size={12} color={colors.mutedForeground} />
                            <Text style={[styles.groupMetaText, { color: colors.mutedForeground }]}>
                              {group.totalParticipantes}
                            </Text>
                          </View>
                          {group.sorteioRealizado && (
                            <View style={styles.groupMetaItem}>
                              <Feather name="check-circle" size={12} color={colors.primary} />
                              <Text style={[styles.groupMetaText, { color: colors.primary }]}>
                                Sorteado
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Feather
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={colors.mutedForeground}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Group Content */}
                  {isExpanded && (
                    <CardContent style={styles.groupContent}>
                      {/* Meu Amigo Sorteado */}
                      {group.sorteioRealizado && group.amigoSorteado && (
                        <View
                          style={[
                            styles.amigoCard,
                            { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` },
                          ]}
                        >
                          <View style={styles.amigoHeader}>
                            <Feather name="heart" size={16} color={colors.primary} />
                            <Text style={[styles.amigoLabel, { color: colors.foreground }]}>
                              Você tirou:
                            </Text>
                          </View>
                          <View style={styles.amigoInfo}>
                            <View style={[styles.amigoIcon, { backgroundColor: `${colors.primary}20` }]}>
                              <Feather name="gift" size={20} color={colors.primary} />
                            </View>
                            <View style={styles.amigoDetails}>
                              <Text style={[styles.amigoName, { color: colors.foreground }]}>
                                {group.amigoSorteado.nome}
                              </Text>
                              {group.amigoSorteado.presente ? (
                                <Text style={[styles.amigoPresente, { color: colors.mutedForeground }]}>
                                  🎁 Quer: {group.amigoSorteado.presente}
                                </Text>
                              ) : (
                                <Text style={[styles.amigoPresente, { color: colors.mutedForeground }]}>
                                  Sem presente cadastrado
                                </Text>
                              )}
                            </View>
                          </View>
                          {group.sorteioData && (
                            <View style={styles.sorteioDate}>
                              <Feather name="calendar" size={12} color={colors.mutedForeground} />
                              <Text style={[styles.sorteioDateText, { color: colors.mutedForeground }]}>
                                {formatDate(group.sorteioData)}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Meu Presente */}
                      <View style={[styles.meuPresenteCard, { backgroundColor: colors.secondary }]}>
                        <View style={styles.meuPresenteHeader}>
                          <Feather name="user-check" size={16} color={colors.primary} />
                          <Text style={[styles.meuPresenteLabel, { color: colors.mutedForeground }]}>
                            Seu nome:
                          </Text>
                          <Text
                            style={[styles.meuPresenteName, { color: colors.foreground }]}
                            numberOfLines={1}
                          >
                            {group.meuNome}
                          </Text>
                        </View>

                        {editingPresente === group.groupId ? (
                          <View style={styles.editRow}>
                            <Input
                              placeholder="O que você quer ganhar?"
                              value={presenteValue}
                              onChangeText={setPresenteValue}
                              maxLength={100}
                              style={styles.editInput}
                            />
                            <TouchableOpacity
                              style={[styles.editButton, { backgroundColor: colors.primary }]}
                              onPress={() => savePresente(group.groupId)}
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <ActivityIndicator size="small" color={colors.primaryForeground} />
                              ) : (
                                <Feather name="check" size={16} color={colors.primaryForeground} />
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.editButton, { backgroundColor: colors.muted }]}
                              onPress={cancelEditingPresente}
                            >
                              <Feather name="x" size={16} color={colors.foreground} />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.presenteRow}>
                            <Text
                              style={[styles.presenteText, { color: colors.mutedForeground }]}
                              numberOfLines={2}
                            >
                              {group.meuPresente ? (
                                <>🎁 {group.meuPresente}</>
                              ) : (
                                <Text style={{ fontStyle: 'italic' }}>Nenhum presente cadastrado</Text>
                              )}
                            </Text>
                            <Button
                              variant="ghost"
                              size="sm"
                              onPress={() => startEditingPresente(group.groupId, group.meuPresente || null)}
                            >
                              <View style={styles.buttonContent}>
                                <Feather name="edit-3" size={12} color={colors.foreground} />
                                <Text style={{ color: colors.foreground, fontSize: fontSize.xs }}>
                                  {group.meuPresente ? 'Editar' : 'Adicionar'}
                                </Text>
                              </View>
                            </Button>
                          </View>
                        )}
                      </View>

                      {/* Lista de Participantes */}
                      <View style={styles.participantesSection}>
                        <View style={styles.participantesHeader}>
                          <Feather name="users" size={16} color={colors.mutedForeground} />
                          <Text style={[styles.participantesTitle, { color: colors.foreground }]}>
                            Participantes
                          </Text>
                          {search.trim() && (
                            <Text style={[styles.participantesCount, { color: colors.mutedForeground }]}>
                              ({filteredParticipantes.length} encontrados)
                            </Text>
                          )}
                        </View>

                        {filteredParticipantes.length === 0 ? (
                          <View style={styles.noResults}>
                            <Feather name="search" size={32} color={`${colors.mutedForeground}30`} />
                            <Text style={[styles.noResultsText, { color: colors.mutedForeground }]}>
                              Nenhum participante para "{search}"
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.participantesList}>
                            {filteredParticipantes.map((participante, idx) => {
                              const isMe = participante.id === group.userIdInGroup;
                              const isMyTarget = group.amigoSorteado?.id === participante.id;

                              return (
                                <View
                                  key={participante.id}
                                  style={[
                                    styles.participanteItem,
                                    {
                                      backgroundColor: isMe
                                        ? `${colors.primary}10`
                                        : isMyTarget
                                        ? `${colors.warning}10`
                                        : `${colors.secondary}50`,
                                      borderColor: isMe
                                        ? `${colors.primary}30`
                                        : isMyTarget
                                        ? `${colors.warning}30`
                                        : 'transparent',
                                    },
                                  ]}
                                >
                                  <View
                                    style={[
                                      styles.participanteNumber,
                                      {
                                        backgroundColor: isMe
                                          ? `${colors.primary}20`
                                          : isMyTarget
                                          ? `${colors.warning}20`
                                          : colors.secondary,
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.participanteNumberText,
                                        {
                                          color: isMe
                                            ? colors.primary
                                            : isMyTarget
                                            ? colors.warning
                                            : colors.mutedForeground,
                                        },
                                      ]}
                                    >
                                      {idx + 1}
                                    </Text>
                                  </View>
                                  <View style={styles.participanteInfo}>
                                    <View style={styles.participanteNameRow}>
                                      <Text
                                        style={[
                                          styles.participanteName,
                                          {
                                            color: isMe
                                              ? colors.primary
                                              : isMyTarget
                                              ? colors.warning
                                              : colors.foreground,
                                          },
                                        ]}
                                        numberOfLines={1}
                                      >
                                        {participante.nome}
                                      </Text>
                                      {isMe && (
                                        <View style={[styles.tag, { backgroundColor: `${colors.primary}20` }]}>
                                          <Text style={[styles.tagText, { color: colors.primary }]}>você</Text>
                                        </View>
                                      )}
                                      {isMyTarget && (
                                        <View style={[styles.tag, { backgroundColor: `${colors.warning}20` }]}>
                                          <Text style={[styles.tagText, { color: colors.warning }]}>amigo</Text>
                                        </View>
                                      )}
                                    </View>
                                    {participante.presente ? (
                                      <Text style={[styles.participantePresente, { color: colors.mutedForeground }]}>
                                        🎁 {participante.presente}
                                      </Text>
                                    ) : (
                                      <Text
                                        style={[
                                          styles.participantePresente,
                                          { color: `${colors.mutedForeground}60`, fontStyle: 'italic' },
                                        ]}
                                      >
                                        Sem presente
                                      </Text>
                                    )}
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>

                      {/* Aguardando Sorteio */}
                      {!group.sorteioRealizado && (
                        <View
                          style={[
                            styles.warningBox,
                            { backgroundColor: `${colors.warning}10`, borderColor: `${colors.warning}30` },
                          ]}
                        >
                          <Text style={[styles.warningTitle, { color: colors.warning }]}>
                            ⏳ Aguardando sorteio
                          </Text>
                          <Text style={[styles.warningText, { color: colors.mutedForeground }]}>
                            O admin do grupo precisa realizar o sorteio pelo WhatsApp.
                          </Text>
                        </View>
                      )}

                      {/* Dicas */}
                      <View
                        style={[
                          styles.tipsBox,
                          { backgroundColor: `${colors.primary}05`, borderColor: `${colors.primary}15` },
                        ]}
                      >
                        <Text style={[styles.tipsTitle, { color: colors.mutedForeground }]}>
                          💡 Comandos do bot:
                        </Text>
                        <View style={styles.tipsList}>
                          <Text style={[styles.tipItem, { color: colors.mutedForeground }]}>
                            •{' '}
                            <Text style={[styles.tipCode, { backgroundColor: colors.secondary }]}>
                              !amigoSecreto listaPresente add
                            </Text>{' '}
                            - Cadastrar
                          </Text>
                          <Text style={[styles.tipItem, { color: colors.mutedForeground }]}>
                            •{' '}
                            <Text style={[styles.tipCode, { backgroundColor: colors.secondary }]}>
                              !amigoSecreto listaPresente edit
                            </Text>{' '}
                            - Editar
                          </Text>
                          <Text style={[styles.tipItem, { color: colors.mutedForeground }]}>
                            •{' '}
                            <Text style={[styles.tipCode, { backgroundColor: colors.secondary }]}>
                              !amigoSecreto listaPresente
                            </Text>{' '}
                            - Ver todos
                          </Text>
                        </View>
                      </View>
                    </CardContent>
                  )}
                </Card>
              );
            })}
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
  searchContent: {
    padding: spacing.md,
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
  groupHeader: {
    padding: spacing.md,
  },
  groupHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  groupMeta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  groupMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  groupMetaText: {
    fontSize: fontSize.xs,
  },
  groupContent: {
    paddingTop: 0,
    gap: spacing.md,
  },
  amigoCard: {
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  amigoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  amigoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  amigoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  amigoIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amigoDetails: {
    flex: 1,
  },
  amigoName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  amigoPresente: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  sorteioDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  sorteioDateText: {
    fontSize: 10,
  },
  meuPresenteCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  meuPresenteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  meuPresenteLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  meuPresenteName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  editRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editInput: {
    flex: 1,
    height: 40,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presenteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 24,
  },
  presenteText: {
    fontSize: fontSize.xs,
    flex: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  participantesSection: {
    marginTop: spacing.sm,
  },
  participantesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  participantesTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  participantesCount: {
    fontSize: fontSize.xs,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  noResultsText: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  participantesList: {
    gap: spacing.sm,
  },
  participanteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  participanteNumber: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participanteNumberText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  participanteInfo: {
    flex: 1,
  },
  participanteNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  participanteName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flexShrink: 1,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: 10,
  },
  participantePresente: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  warningBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  warningTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  warningText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  tipsBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  tipsTitle: {
    fontSize: fontSize.sm,
  },
  tipsList: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  tipItem: {
    fontSize: fontSize.xs,
  },
  tipCode: {
    fontSize: 10,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    fontFamily: 'monospace',
  },
});
