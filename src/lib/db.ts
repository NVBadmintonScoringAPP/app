import Dexie, { type Table } from 'dexie';
import type { Match, PointLog, SyncQueueItem, DisciplinaryCard } from '@/types';

export interface LocalMatch extends Match {
  id: string;
}

export class BadmintonDB extends Dexie {
  matches!: Table<LocalMatch, string>;
  pointLogs!: Table<PointLog, number>;
  syncQueue!: Table<SyncQueueItem, number>;
  cards!: Table<DisciplinaryCard, number>;

  constructor() {
    super('badminton_umpire');

    this.version(1).stores({
      matches: 'id, externalId, status, syncStatus, courtNumber, scheduledTime',
      pointLogs: '++id, matchId, timestamp, setNumber, syncStatus',
      syncQueue: '++id, matchId, action, timestamp',
    });

    this.version(2).stores({
      matches: 'id, externalId, status, syncStatus, courtNumber, scheduledTime',
      pointLogs: '++id, matchId, timestamp, setNumber, syncStatus',
      syncQueue: '++id, matchId, action, timestamp',
      cards: '++id, matchId, timestamp, cardColor, syncStatus',
    });
  }
}

let dbInstance: BadmintonDB | null = null;

export function getDB(): BadmintonDB {
  if (!dbInstance) {
    dbInstance = new BadmintonDB();
  }
  return dbInstance;
}

export async function saveLocalMatch(match: LocalMatch): Promise<void> {
  const db = getDB();
  await db.matches.put(match);
}

export async function getLocalMatch(id: string): Promise<LocalMatch | undefined> {
  const db = getDB();
  return db.matches.get(id);
}

export async function getAllLocalMatches(): Promise<LocalMatch[]> {
  const db = getDB();
  return db.matches.toArray();
}

export async function addPointLog(log: PointLog): Promise<number> {
  const db = getDB();
  return db.pointLogs.add(log);
}

export async function deleteLastPointLog(matchId: string): Promise<void> {
  const db = getDB();
  const logs = await db.pointLogs.where('matchId').equals(matchId).toArray();
  if (logs.length > 0) {
    const last = logs[logs.length - 1];
    if (last.id) await db.pointLogs.delete(last.id);
  }
}

export async function getPointLogs(matchId: string): Promise<PointLog[]> {
  const db = getDB();
  return db.pointLogs.where('matchId').equals(matchId).toArray();
}

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id'>): Promise<void> {
  const db = getDB();
  await db.syncQueue.add(item);
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = getDB();
  return db.syncQueue.toArray();
}

export async function removeFromSyncQueue(id: number): Promise<void> {
  const db = getDB();
  await db.syncQueue.delete(id);
}

export async function getPendingSyncCount(): Promise<number> {
  const db = getDB();
  return db.syncQueue.count();
}

export async function addCard(card: DisciplinaryCard): Promise<number> {
  const db = getDB();
  return db.cards.add(card);
}

export async function getCards(matchId: string): Promise<DisciplinaryCard[]> {
  const db = getDB();
  return db.cards.where('matchId').equals(matchId).toArray();
}
