import jsPDF from 'jspdf';
import type { Match, PointLog } from '@/types';

/**
 * Helper: Draw a rounded rectangle manually (polyfill for ctx.roundRect which
 * is only available in Chrome 99+ / Edge 99+).
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Generates an official BWF match scoresheet PDF.
 * Uses an HTML5 2D canvas to render the scoresheet with 100% native Cyrillic
 * (Bulgarian) font support, ensuring the resulting PDF is valid and opens in
 * all PDF viewers.
 */
export function generatePdfScoresheet(
  match: Match,
  pointLogs: PointLog[],
  setScores: Array<{ left: number; right: number }>,
  durationMinutes: number = 35
) {
  // A4 at 150 DPI → 1240 × 1754 px
  const W = 1240;
  const H = 1754;
  const PAD = 50;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('[PDF] Could not get canvas 2D context');
    return;
  }

  // ── Background ────────────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // ── Top tricolor bar (White | Green | Red) ────────────────────────────────
  const BAR = 10;
  const third = W / 3;
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, third, BAR);
  ctx.fillStyle = '#6bc33a';
  ctx.fillRect(third, 0, third, BAR);
  ctx.fillStyle = '#e11e24';
  ctx.fillRect(third * 2, 0, third, BAR);

  let y = BAR + 20;

  // ── Header card ───────────────────────────────────────────────────────────
  const hCardH = 115;
  ctx.fillStyle = '#090d16';
  ctx.fillRect(PAD, y, W - PAD * 2, hCardH);

  // Green | Red accent stripe on header top edge
  ctx.fillStyle = '#6bc33a';
  ctx.fillRect(PAD, y, (W - PAD * 2) / 2, 3);
  ctx.fillStyle = '#e11e24';
  ctx.fillRect(PAD + (W - PAD * 2) / 2, y, (W - PAD * 2) / 2, 3);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillText('НАЦИОНАЛНА ВЕРИГА БАДМИНТОН', PAD + 25, y + 44);

  ctx.fillStyle = '#6bc33a';
  ctx.font = 'bold 14px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillText('ОФИЦИАЛЕН BWF СЪДИЙСКИ ПРОТОКОЛ  /  OFFICIAL SCORESHEET', PAD + 25, y + 74);

  // Court & Match badge (right side)
  const badgeX = W - PAD - 205;
  ctx.fillStyle = 'rgba(107,195,58,0.12)';
  roundRect(ctx, badgeX, y + 18, 170, 75, 8);
  ctx.fill();
  ctx.strokeStyle = '#6bc33a';
  ctx.lineWidth = 1.5;
  roundRect(ctx, badgeX, y + 18, 170, 75, 8);
  ctx.stroke();

  ctx.fillStyle = '#6bc33a';
  ctx.font = 'bold 12px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillText('КОРТ / COURT', badgeX + 14, y + 46);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillText(`${match.courtNumber || '1'}`, badgeX + 80, y + 48);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillText(`МАЧ: ${match.matchNumber || '-'}`, badgeX + 14, y + 76);

  y += hCardH + 18;

  // ── Metadata row ──────────────────────────────────────────────────────────
  const metaH = 72;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD, y, W - PAD * 2, metaH);

  const dateStr = match.createdAt
    ? new Date(match.createdAt).toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('bg-BG');

  const formatStr =
    match.format === '3x21' ? 'BWF 3×21' :
    match.format === '3x15' ? 'BWF 3×15' : 'Персонализиран';

  const disciplineStr =
    match.gameType === 'singles' ? 'Единично (Singles)' : 'Двойки (Doubles)';

  const metaCols = [
    { label: 'ДАТА И ЧАС', val: dateStr },
    { label: 'ФОРМАТ', val: formatStr },
    { label: 'ДИСЦИПЛИНА', val: disciplineStr },
    { label: 'ВРЕМЕТРАЕНЕ', val: `${durationMinutes} мин.` },
  ];

  const colW = (W - PAD * 2) / 4;
  metaCols.forEach((col, idx) => {
    const cx = PAD + idx * colW + 16;
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillText(col.label, cx, y + 26);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillText(col.val, cx, y + 54);
  });

  y += metaH + 18;

  // ── Teams scoreboard card ─────────────────────────────────────────────────
  const sbH = 130;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(PAD, y, W - PAD * 2, sbH);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD, y, W - PAD * 2, sbH);

  const team1 = match.playerLeftName + (match.playerLeftPartner ? ` & ${match.playerLeftPartner}` : '');
  const team2 = match.playerRightName + (match.playerRightPartner ? ` & ${match.playerRightPartner}` : '');

  // Team 1
  ctx.fillStyle = '#16a34a';
  ctx.font = 'bold 12px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillText('ОТБОР 1 (ЛЯВА СТРАНА)', PAD + 20, y + 32);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillText(team1.substring(0, 30), PAD + 20, y + 72);

  // Sets score box centre
  const sboxW = 160;
  const sboxX = W / 2 - sboxW / 2;
  ctx.fillStyle = '#090d16';
  roundRect(ctx, sboxX, y + 22, sboxW, 80, 12);
  ctx.fill();

  ctx.font = 'bold 40px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = match.setsLeft > match.setsRight ? '#6bc33a' : '#e2e8f0';
  ctx.fillText(`${match.setsLeft}`, sboxX + 28, y + 80);
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 28px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillText(':', sboxX + sboxW / 2 - 6, y + 78);
  ctx.fillStyle = match.setsRight > match.setsLeft ? '#6bc33a' : '#e2e8f0';
  ctx.font = 'bold 40px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillText(`${match.setsRight}`, sboxX + 96, y + 80);

  ctx.fillStyle = '#64748b';
  ctx.font = '11px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ГЕЙМОВЕ / GAMES', W / 2, y + 116);
  ctx.textAlign = 'left';

  // Team 2
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 12px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillText('ОТБОР 2 (ДЯСНА СТРАНА)', W - PAD - 380, y + 32);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillText(team2.substring(0, 30), W - PAD - 380, y + 72);

  y += sbH + 18;

  // ── Set-by-set breakdown ──────────────────────────────────────────────────
  // Table header
  ctx.fillStyle = '#090d16';
  ctx.fillRect(PAD, y, W - PAD * 2, 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillText('РЕЗУЛТАТ ПО ГЕЙМОВЕ  /  GAME SCORES', PAD + 18, y + 25);
  y += 36;

  const validSets = setScores.length > 0
    ? setScores
    : [{ left: match.scoreLeft, right: match.scoreRight }];

  validSets.forEach((set, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(PAD, y, W - PAD * 2, 42);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(PAD, y, W - PAD * 2, 42);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillText(`Гейм ${idx + 1}:`, PAD + 18, y + 28);

    ctx.font = '14px "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`${team1.substring(0, 22)}: ${set.left} т.`, PAD + 180, y + 28);
    ctx.fillText(`${team2.substring(0, 22)}: ${set.right} т.`, PAD + 520, y + 28);

    const leftWon = set.left > set.right;
    ctx.fillStyle = leftWon ? '#16a34a' : '#dc2626';
    ctx.font = 'bold 14px "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillText(
      `● ${leftWon ? team1.substring(0, 20) : team2.substring(0, 20)}`,
      PAD + 870,
      y + 28
    );

    y += 42;
  });

  y += 24;

  // ── Point log table ───────────────────────────────────────────────────────
  ctx.fillStyle = '#090d16';
  ctx.fillRect(PAD, y, W - PAD * 2, 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillText('ХРОНОЛОГИЯ НА ТОЧКИТЕ  /  POINT PROGRESSION LOG', PAD + 18, y + 25);
  y += 36;

  // Column headers
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(PAD, y, W - PAD * 2, 30);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD, y, W - PAD * 2, 30);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 11px "Segoe UI", Roboto, Arial, sans-serif';
  const COL = { num: PAD + 14, game: PAD + 60, score: PAD + 160, server: PAD + 310, receiver: PAD + 590, point: PAD + 860 };
  ctx.fillText('#', COL.num, y + 20);
  ctx.fillText('ГЕЙМ', COL.game, y + 20);
  ctx.fillText('РЕЗУЛТАТ', COL.score, y + 20);
  ctx.fillText('СЕРВИРАЩ', COL.server, y + 20);
  ctx.fillText('ПОСРЕЩАЩ', COL.receiver, y + 20);
  ctx.fillText('ТОЧКА ЗА', COL.point, y + 20);
  y += 30;

  const MAX_ROWS = 18;
  const logsToRender = pointLogs.slice(0, MAX_ROWS);

  if (logsToRender.length === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(PAD, y, W - PAD * 2, 38);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(PAD, y, W - PAD * 2, 38);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 13px "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillText('Резултатът е записан официално в протокола на срещата.', PAD + 18, y + 25);
    y += 38;
  } else {
    logsToRender.forEach((log, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      ctx.fillRect(PAD, y, W - PAD * 2, 30);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(PAD, y, W - PAD * 2, 30);

      ctx.fillStyle = '#64748b';
      ctx.font = '12px "Segoe UI", Roboto, Arial, sans-serif';
      ctx.fillText(`${idx + 1}`, COL.num, y + 21);
      ctx.fillText(`Гейм ${log.setNumber}`, COL.game, y + 21);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px "Segoe UI", Roboto, Arial, sans-serif';
      ctx.fillText(`${log.scoreLeft} – ${log.scoreRight}`, COL.score, y + 21);

      ctx.fillStyle = '#334155';
      ctx.font = '12px "Segoe UI", Roboto, Arial, sans-serif';
      ctx.fillText((log.server || '').substring(0, 26), COL.server, y + 21);
      ctx.fillText((log.receiver || '').substring(0, 26), COL.receiver, y + 21);

      ctx.fillStyle = log.scoredBy === 'left' ? '#16a34a' : '#dc2626';
      ctx.font = 'bold 12px "Segoe UI", Roboto, Arial, sans-serif';
      ctx.fillText(log.scoredBy === 'left' ? '● Отбор 1' : '● Отбор 2', COL.point, y + 21);

      y += 30;
    });

    if (pointLogs.length > MAX_ROWS) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(PAD, y, W - PAD * 2, 30);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(PAD, y, W - PAD * 2, 30);
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 12px "Segoe UI", Roboto, Arial, sans-serif';
      ctx.fillText(`... и още ${pointLogs.length - MAX_ROWS} точки, регистрирани в базата данни на турнира.`, PAD + 18, y + 21);
      y += 30;
    }
  }

  // ── Signatures ────────────────────────────────────────────────────────────
  const sigY = Math.max(y + 40, H - 200);

  const sigs = [
    { label: 'Съдия на мача (Umpire)', x1: PAD + 20, x2: PAD + 280 },
    { label: 'Съдия на сервиса (Service Judge)', x1: PAD + 380, x2: PAD + 680 },
    { label: 'Главен съдия (Head Referee)', x1: PAD + 780, x2: PAD + 1080 },
  ];

  sigs.forEach(({ label, x1, x2 }) => {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, sigY + 60);
    ctx.lineTo(x2, sigY + 60);
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 12px "Segoe UI", Roboto, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, (x1 + x2) / 2, sigY + 82);
    ctx.textAlign = 'left';
  });

  // ── Bottom tricolor bar ───────────────────────────────────────────────────
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, H - BAR, third, BAR);
  ctx.fillStyle = '#6bc33a';
  ctx.fillRect(third, H - BAR, third, BAR);
  ctx.fillStyle = '#e11e24';
  ctx.fillRect(third * 2, H - BAR, third, BAR);

  // ── Build PDF from canvas image ───────────────────────────────────────────
  try {
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);

    // Build a clean filename (court number + local timestamp)
    const court = (match.courtNumber || '1').replace(/[^\w]/g, '');
    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
    const filename = `NV_Protokol_Kort${court}_${ts}.pdf`;

    // ── Direct download with guaranteed .pdf extension ──────────────────────
    // 1. Ensure ASCII-only filename (Cyrillic characters in a.download cause
    //    Chromium/Edge to strip the extension and save as raw UUIDs)
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(
      new Blob([pdfBlob], { type: 'application/pdf' })
    );

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(blobUrl);
    }, 15000);

    console.log('[PDF] Scoresheet downloaded:', filename);
  } catch (err) {
    console.error('[PDF] Error generating PDF:', err);
    alert('Грешка при генериране на PDF. Моля опитайте отново.');
  }
}
