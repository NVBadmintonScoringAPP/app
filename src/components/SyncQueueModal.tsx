import { useEffect, useState } from 'react';
import { RefreshCw, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPointLogs, getSyncQueue, getDB } from '@/lib/db';
import { getSyncService } from '@/lib/sync';
import type { PointLog, SyncQueueItem } from '@/types';

interface SyncQueueModalProps {
  open: boolean;
  onClose: () => void;
  matchId: string;
}

export function SyncQueueModal({ open, onClose, matchId }: SyncQueueModalProps) {
  const [logs, setLogs] = useState<PointLog[]>([]);
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);

  const refresh = async () => {
    const pointLogs = await getPointLogs(matchId);
    setLogs(pointLogs.reverse());
    const q = await getSyncQueue();
    setQueue(q);
  };

  useEffect(() => {
    if (open) refresh();
  }, [open, matchId]);

  const handleForceSync = async () => {
    await getSyncService().flush();
    refresh();
  };

  const handleClearQueue = async () => {
    const db = getDB();
    await db.syncQueue.clear();
    refresh();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Sync Queue & Audit Log" className="max-w-lg">
      <div className="space-y-4">
        {/* Sync Queue */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300">Pending Sync ({queue.length})</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleForceSync}>
                <RefreshCw size={14} className="mr-1.5" /> Force Sync
              </Button>
              {queue.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleClearQueue}>
                  <Trash2 size={14} className="mr-1.5" /> Clear
                </Button>
              )}
            </div>
          </div>
          <div className="max-h-32 space-y-1.5 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800/50 p-2">
            {queue.length === 0 ? (
              <p className="py-2 text-center text-xs text-slate-500">No pending items</p>
            ) : (
              queue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded bg-slate-800 px-2 py-1.5 text-xs"
                >
                  <span className="font-mono text-amber-400">{item.action}</span>
                  <span className="text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Point Logs */}
        <div>
          <h3 className="mb-2 text-sm font-bold text-slate-300">Point Log ({logs.length})</h3>
          <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800/50 p-2">
            {logs.length === 0 ? (
              <p className="py-2 text-center text-xs text-slate-500">No points logged yet</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded bg-slate-800 px-2 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={log.syncStatus === 'synced' ? 'success' : 'warning'}>
                      {log.syncStatus === 'synced' ? (
                        <CheckCircle2 size={10} className="mr-1" />
                      ) : (
                        <AlertTriangle size={10} className="mr-1" />
                      )}
                      {log.syncStatus}
                    </Badge>
                    <span className="text-slate-300">
                      Set {log.setNumber}: {log.scoreLeft}-{log.scoreRight}
                    </span>
                    <span className="text-slate-500">→ {log.scoredBy}</span>
                  </div>
                  <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
