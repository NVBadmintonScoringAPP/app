import { supabase } from './supabase';
import {
  getDB,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  getPendingSyncCount,
  saveLocalMatch,
  getLocalMatch,
  addPointLog,
  addCard,
} from './db';
import type { Match, PointLog, DisciplinaryCard } from '@/types';
import { toUUID, isValidUUID } from './uuid';

type SyncListener = (online: boolean, pendingCount: number) => void;

function isFatalClientError(error: any): boolean {
  if (!error) return false;
  // 22P02 is postgres invalid syntax for type uuid
  if (error.code === '22P02' || error.code === 'PGRST204' || error.code === '42703' || error.code === '23503') {
    return true;
  }
  if (typeof error.status === 'number' && error.status >= 400 && error.status < 500 && error.status !== 429) {
    return true;
  }
  return false;
}

class SyncService {
  private listeners: Set<SyncListener> = new Set();
  private online = true;
  private flushing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.online = navigator.onLine;
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());

      // One-time cleanup and sanitation of legacy/poisoned items in syncQueue
      setTimeout(() => {
        this.sanitizeQueue();
      }, 1000);
    }
  }

  isOnline(): boolean {
    return this.online;
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.online, 0);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    getPendingSyncCount().then((count) => {
      this.listeners.forEach((l) => l(this.online, count));
    });
  }

  private handleOnline(): void {
    this.online = true;
    this.flush();
    this.notify();
  }

  private handleOffline(): void {
    this.online = false;
    this.notify();
  }

  async queueAction(matchId: string, action: string, payload: Record<string, unknown>): Promise<void> {
    const safeMatchId = toUUID(matchId);
    await addToSyncQueue({ matchId: safeMatchId, action, payload, timestamp: new Date().toISOString() });
    this.notify();
    if (this.online) this.flush();
  }

  async saveMatch(match: Match): Promise<void> {
    const safeId = toUUID(match.id);
    const sanitizedMatch: Match = {
      ...match,
      id: safeId,
    };

    await saveLocalMatch(sanitizedMatch);

    if (this.online) {
      try {
        const { error } = await supabase.from('matches').upsert(
          {
            id: safeId,
            match_number: match.matchNumber,
            player_left_name: match.playerLeftName,
            player_right_name: match.playerRightName,
            player_left_partner: match.playerLeftPartner || null,
            player_right_partner: match.playerRightPartner || null,
            score_left: match.scoreLeft,
            score_right: match.scoreRight,
            current_set: match.currentSet,
            sets_left: match.setsLeft,
            sets_right: match.setsRight,
            serving_side: match.servingSide,
            status: match.status,
            winner: match.winner,
            format: match.format,
            game_type: match.gameType,
            court_number: match.courtNumber,
            sync_status: 'synced',
            updated_at: match.updatedAt,
            external_id: match.id !== safeId ? match.id : null,
          },
          { onConflict: 'id' }
        );

        if (error) {
          console.warn('[Sync] Supabase saveMatch warning:', error.message);
          if (!isFatalClientError(error)) {
            await this.queueAction(safeId, 'UPDATE_MATCH', { ...sanitizedMatch });
          }
        }
      } catch (err) {
        console.warn('[Sync] Network error on saveMatch:', err);
        await this.queueAction(safeId, 'UPDATE_MATCH', { ...sanitizedMatch });
      }
    } else {
      await this.queueAction(safeId, 'UPDATE_MATCH', { ...sanitizedMatch });
    }
  }

  async logPoint(log: PointLog): Promise<void> {
    const safeMatchId = toUUID(log.matchId);
    const sanitizedLog: PointLog = {
      ...log,
      matchId: safeMatchId,
    };

    await addPointLog(sanitizedLog);

    if (this.online) {
      try {
        // Ensure match exists in Supabase first to satisfy foreign key constraint
        const localMatch = await getLocalMatch(safeMatchId);
        if (localMatch) {
          await this.saveMatch(localMatch);
        }

        const { error } = await supabase.from('point_logs').insert({
          match_id: safeMatchId,
          timestamp: log.timestamp,
          set_number: log.setNumber,
          score_left: log.scoreLeft,
          score_right: log.scoreRight,
          server: log.server,
          receiver: log.receiver,
          scored_by: log.scoredBy,
        });

        if (error) {
          if (error.code === '23503' || error.message?.includes('foreign key')) {
            if (localMatch) {
              await this.saveMatch(localMatch);
              await supabase.from('point_logs').insert({
                match_id: safeMatchId,
                timestamp: log.timestamp,
                set_number: log.setNumber,
                score_left: log.scoreLeft,
                score_right: log.scoreRight,
                server: log.server,
                receiver: log.receiver,
                scored_by: log.scoredBy,
              });
            }
          } else {
            console.warn('[Sync] Supabase logPoint warning:', error.message);
            if (!isFatalClientError(error)) {
              await this.queueAction(safeMatchId, 'ADD_POINT', { ...sanitizedLog });
            }
          }
        }
      } catch (err) {
        console.warn('[Sync] Network error on logPoint:', err);
        await this.queueAction(safeMatchId, 'ADD_POINT', { ...sanitizedLog });
      }
    } else {
      await this.queueAction(safeMatchId, 'ADD_POINT', { ...sanitizedLog });
    }
  }

  async undoPoint(matchId: string): Promise<void> {
    const safeMatchId = toUUID(matchId);
    if (this.online) {
      const db = getDB();
      const logs = await db.pointLogs.where('matchId').equals(safeMatchId).toArray();
      if (logs.length > 0) {
        const last = logs[logs.length - 1];
        if (last.id) {
          await db.pointLogs.delete(last.id);
        }
      }
    } else {
      await this.queueAction(safeMatchId, 'UNDO_POINT', { matchId: safeMatchId });
    }
  }

  async logCard(card: DisciplinaryCard): Promise<void> {
    const safeMatchId = toUUID(card.matchId);
    const sanitizedCard: DisciplinaryCard = {
      ...card,
      matchId: safeMatchId,
    };

    await addCard(sanitizedCard);

    if (this.online) {
      try {
        const { error } = await supabase.from('cards').insert({
          match_id: safeMatchId,
          timestamp: card.timestamp,
          card_color: card.cardColor,
          side: card.side,
          player_name: card.playerName,
          reason: card.reason,
        });

        if (error) {
          console.warn('[Sync] Supabase logCard warning:', error.message);
          if (!isFatalClientError(error)) {
            await this.queueAction(safeMatchId, 'ADD_CARD', { ...sanitizedCard });
          }
        }
      } catch (err) {
        console.warn('[Sync] Network error on logCard:', err);
        await this.queueAction(safeMatchId, 'ADD_CARD', { ...sanitizedCard });
      }
    } else {
      await this.queueAction(safeMatchId, 'ADD_CARD', { ...sanitizedCard });
    }
  }

  private async sanitizeQueue(): Promise<void> {
    try {
      const queue = await getSyncQueue();
      for (const item of queue) {
        if (!item.id) continue;
        // If an item in queue is using non-uuid, remove or heal it
        if (item.matchId && !isValidUUID(item.matchId)) {
          await removeFromSyncQueue(item.id);
        }
      }
      this.notify();
    } catch {
      // ignore
    }
  }

  async flush(): Promise<void> {
    if (this.flushing || !this.online) return;
    this.flushing = true;

    try {
      const queue = await getSyncQueue();
      for (const item of queue) {
        try {
          const payload = item.payload as Record<string, unknown>;
          if (item.action === 'UPDATE_MATCH') {
            const match = payload as unknown as Match;
            const safeId = toUUID(match.id || item.matchId);
            const { error } = await supabase.from('matches').upsert(
              {
                id: safeId,
                match_number: match.matchNumber,
                player_left_name: match.playerLeftName,
                player_right_name: match.playerRightName,
                player_left_partner: match.playerLeftPartner || null,
                player_right_partner: match.playerRightPartner || null,
                score_left: match.scoreLeft,
                score_right: match.scoreRight,
                current_set: match.currentSet,
                sets_left: match.setsLeft,
                sets_right: match.setsRight,
                serving_side: match.servingSide,
                status: match.status,
                winner: match.winner,
                format: match.format,
                game_type: match.gameType,
                court_number: match.courtNumber,
                sync_status: 'synced',
                updated_at: match.updatedAt,
                external_id: match.id !== safeId ? match.id : null,
              },
              { onConflict: 'id' }
            );

            if (!error && item.id) {
              await removeFromSyncQueue(item.id);
            } else if (error && isFatalClientError(error) && item.id) {
              await removeFromSyncQueue(item.id);
            }
          } else if (item.action === 'ADD_POINT') {
            const log = payload as unknown as PointLog;
            const safeMatchId = toUUID(log.matchId || item.matchId);
            const { error } = await supabase.from('point_logs').insert({
              match_id: safeMatchId,
              timestamp: log.timestamp,
              set_number: log.setNumber,
              score_left: log.scoreLeft,
              score_right: log.scoreRight,
              server: log.server,
              receiver: log.receiver,
              scored_by: log.scoredBy,
            });

            if (!error && item.id) {
              await removeFromSyncQueue(item.id);
            } else if (error && isFatalClientError(error) && item.id) {
              await removeFromSyncQueue(item.id);
            }
          } else if (item.action === 'ADD_CARD') {
            const card = payload as unknown as DisciplinaryCard;
            const safeMatchId = toUUID(card.matchId || item.matchId);
            const { error } = await supabase.from('cards').insert({
              match_id: safeMatchId,
              timestamp: card.timestamp,
              card_color: card.cardColor,
              side: card.side,
              player_name: card.playerName,
              reason: card.reason,
            });

            if (!error && item.id) {
              await removeFromSyncQueue(item.id);
            } else if (error && isFatalClientError(error) && item.id) {
              await removeFromSyncQueue(item.id);
            }
          }
        } catch {
          // continue to next item
        }
      }
    } finally {
      this.flushing = false;
      this.notify();
    }
  }
}

let syncInstance: SyncService | null = null;

export function getSyncService(): SyncService {
  if (!syncInstance) {
    syncInstance = new SyncService();
  }
  return syncInstance;
}
