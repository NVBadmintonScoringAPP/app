import { supabase } from './supabase';
import {
  getDB,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  getPendingSyncCount,
  saveLocalMatch,
  addPointLog,
  addCard,
} from './db';
import type { Match, PointLog, DisciplinaryCard } from '@/types';

type SyncListener = (online: boolean, pendingCount: number) => void;

class SyncService {
  private listeners: Set<SyncListener> = new Set();
  private online = true;
  private flushing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.online = navigator.onLine;
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
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
    await addToSyncQueue({ matchId, action, payload, timestamp: new Date().toISOString() });
    this.notify();
    if (this.online) this.flush();
  }

  async saveMatch(match: Match): Promise<void> {
    await saveLocalMatch({ ...match });
    if (this.online) {
      const { error } = await supabase.from('matches').upsert(
        {
          id: match.id,
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
        },
        { onConflict: 'id' }
      );
      if (error) {
        await this.queueAction(match.id, 'UPDATE_MATCH', { ...match });
      }
    } else {
      await this.queueAction(match.id, 'UPDATE_MATCH', { ...match });
    }
  }

  async logPoint(log: PointLog): Promise<void> {
    await addPointLog(log);
    if (this.online) {
      const { error } = await supabase.from('point_logs').insert({
        match_id: log.matchId,
        timestamp: log.timestamp,
        set_number: log.setNumber,
        score_left: log.scoreLeft,
        score_right: log.scoreRight,
        server: log.server,
        receiver: log.receiver,
        scored_by: log.scoredBy,
      });
      if (error) {
        await this.queueAction(log.matchId, 'ADD_POINT', { ...log });
      }
    } else {
      await this.queueAction(log.matchId, 'ADD_POINT', { ...log });
    }
  }

  async undoPoint(matchId: string): Promise<void> {
    if (this.online) {
      const db = getDB();
      const logs = await db.pointLogs.where('matchId').equals(matchId).toArray();
      if (logs.length > 0) {
        const last = logs[logs.length - 1];
        if (last.id) {
          await db.pointLogs.delete(last.id);
        }
      }
    } else {
      await this.queueAction(matchId, 'UNDO_POINT', { matchId });
    }
  }

  async logCard(card: DisciplinaryCard): Promise<void> {
    await addCard(card);
    if (this.online) {
      const { error } = await supabase.from('cards').insert({
        match_id: card.matchId,
        timestamp: card.timestamp,
        card_color: card.cardColor,
        side: card.side,
        player_name: card.playerName,
        reason: card.reason,
      });
      if (error) {
        await this.queueAction(card.matchId, 'ADD_CARD', { ...card });
      }
    } else {
      await this.queueAction(card.matchId, 'ADD_CARD', { ...card });
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
            const { error } = await supabase.from('matches').upsert(
              {
                id: match.id,
                match_number: match.matchNumber,
                player_left_name: match.playerLeftName,
                player_right_name: match.playerRightName,
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
              },
              { onConflict: 'id' }
            );
            if (!error && item.id) await removeFromSyncQueue(item.id);
          } else if (item.action === 'ADD_POINT') {
            const log = payload as unknown as PointLog;
            const { error } = await supabase.from('point_logs').insert({
              match_id: log.matchId,
              timestamp: log.timestamp,
              set_number: log.setNumber,
              score_left: log.scoreLeft,
              score_right: log.scoreRight,
              server: log.server,
              receiver: log.receiver,
              scored_by: log.scoredBy,
            });
            if (!error && item.id) await removeFromSyncQueue(item.id);
          } else if (item.action === 'ADD_CARD') {
            const card = payload as unknown as DisciplinaryCard;
            const { error } = await supabase.from('cards').insert({
              match_id: card.matchId,
              timestamp: card.timestamp,
              card_color: card.cardColor,
              side: card.side,
              player_name: card.playerName,
              reason: card.reason,
            });
            if (!error && item.id) await removeFromSyncQueue(item.id);
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
