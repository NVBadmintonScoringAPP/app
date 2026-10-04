import jsPDF from 'jspdf';
import type { Match, PointLog } from '@/types';

export function generatePdfScoresheet(
  match: Match,
  pointLogs: PointLog[],
  setScores: Array<{ left: number; right: number }>,
  durationMinutes: number = 35
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  // 1. Official NV Badminton Header
  doc.setFillColor(8, 12, 24); // Obsidian dark
  doc.rect(10, y, pageWidth - 20, 24, 'F');

  // Green top line (matching NV logo)
  doc.setFillColor(22, 163, 74);
  doc.rect(10, y, pageWidth - 20, 1.5, 'F');

  // Red bottom line (matching NV logo)
  doc.setFillColor(220, 38, 38);
  doc.rect(10, y + 22.5, pageWidth - 20, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('НАЦИОНАЛНА ВЕРИГА БАДМИНТОН', 14, y + 9);

  doc.setTextColor(34, 197, 94); // emerald-400
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Официален BWF съдийски протокол · Tournament Software', 14, y + 16);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(`КОРТ ${match.courtNumber}`, pageWidth - 32, y + 9);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Мач: ${match.matchNumber}`, pageWidth - 32, y + 15);

  y += 28;

  // 2. Match Metadata Info Box
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.rect(10, y, pageWidth - 20, 18);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('Date & Time:', 14, y + 6);
  doc.text('Format:', 70, y + 6);
  doc.text('Discipline:', 120, y + 6);
  doc.text('Duration:', 160, y + 6);

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  const matchDate = new Date(match.createdAt).toLocaleDateString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  doc.text(`${matchDate} 10:00`, 14, y + 12);
  doc.text(match.format === '3x21' ? 'BWF 3x21' : match.format === '3x15' ? 'BWF 3x15' : 'Custom', 70, y + 12);
  doc.text(match.gameType === 'singles' ? 'Singles (1 vs 1)' : 'Doubles (2 vs 2)', 120, y + 12);
  doc.text(`${durationMinutes} min`, 160, y + 12);

  y += 22;

  // 3. Teams & Result Banner
  const winnerName =
    match.winner === 'left'
      ? match.playerLeftName + (match.playerLeftPartner ? ` & ${match.playerLeftPartner}` : '')
      : match.playerRightName + (match.playerRightPartner ? ` & ${match.playerRightPartner}` : '');

  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(10, y, pageWidth - 20, 24, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(10, y, pageWidth - 20, 24);

  // Team Left
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74); // green
  doc.text('ОТБОР А (ЗЕЛЕН)', 14, y + 7);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(match.playerLeftName + (match.playerLeftPartner ? ` / ${match.playerLeftPartner}` : ''), 14, y + 14);

  // Sets Score in center
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(`${match.setsLeft} - ${match.setsRight}`, pageWidth / 2 - 10, y + 13);

  // Team Right
  doc.setFontSize(10);
  doc.setTextColor(220, 38, 38); // red
  doc.text('ОТБОР Б (ЧЕРВЕН)', pageWidth - 55, y + 7);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(match.playerRightName + (match.playerRightPartner ? ` / ${match.playerRightPartner}` : ''), pageWidth - 70, y + 14);

  y += 28;

  // 4. Sets Breakdown Summary
  doc.setFillColor(15, 23, 42);
  doc.rect(10, y, pageWidth - 20, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SET BREAKDOWN & SCORES', 14, y + 5);

  y += 7;

  // Table of sets
  const setsData = setScores.length > 0 ? setScores : [{ left: match.scoreLeft, right: match.scoreRight }];
  doc.setDrawColor(226, 232, 240);
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  setsData.forEach((set, index) => {
    doc.setFillColor(index % 2 === 0 ? 255 : 248, 250, 252);
    doc.rect(10, y, pageWidth - 20, 8, 'F');
    doc.rect(10, y, pageWidth - 20, 8);

    doc.setFont('helvetica', 'bold');
    doc.text(`Set ${index + 1}:`, 14, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Team A: ${set.left} pts`, 60, y + 5.5);
    doc.text(`Team B: ${set.right} pts`, 110, y + 5.5);
    doc.setFont('helvetica', 'bold');
    const setWinner = set.left > set.right ? 'Winner: Team A' : 'Winner: Team B';
    doc.text(setWinner, 155, y + 5.5);

    y += 8;
  });

  y += 6;

  // 5. Point by Point Progression (Sample / Key milestones)
  doc.setFillColor(15, 23, 42);
  doc.rect(10, y, pageWidth - 20, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('POINT PROGRESSION LOG (OFFICIAL PROTOCOL)', 14, y + 5);

  y += 7;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(10, y, pageWidth - 20, 6, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(10, y, pageWidth - 20, 6);

  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('#', 14, y + 4.5);
  doc.text('Set', 24, y + 4.5);
  doc.text('Score (A - B)', 45, y + 4.5);
  doc.text('Server', 85, y + 4.5);
  doc.text('Receiver', 130, y + 4.5);
  doc.text('Point Winner', 165, y + 4.5);

  y += 6;

  // Render point log items (up to 15 key points or all available on page 1)
  const logsToRender = pointLogs.slice(0, 14);
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);

  logsToRender.forEach((log, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
    doc.rect(10, y, pageWidth - 20, 5.5, 'F');
    doc.rect(10, y, pageWidth - 20, 5.5);

    doc.text(`${idx + 1}`, 14, y + 4);
    doc.text(`Set ${log.setNumber}`, 24, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.text(`${log.scoreLeft} - ${log.scoreRight}`, 45, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(`${log.server.substring(0, 18)}`, 85, y + 4);
    doc.text(`${log.receiver.substring(0, 18)}`, 130, y + 4);
    doc.text(log.scoredBy === 'left' ? 'Team A' : 'Team B', 165, y + 4);

    y += 5.5;
  });

  if (pointLogs.length > 14) {
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`... and ${pointLogs.length - 14} more rally point logs recorded in local Dexie database.`, 14, y + 5);
    y += 8;
  } else {
    y += 4;
  }

  // 6. Signatures and Verification Footer
  y = Math.max(y, 250);
  doc.setDrawColor(203, 213, 225);
  doc.line(10, y, pageWidth - 10, y);

  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Official Match Winner:', 14, y + 4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(winnerName || 'Team A', 48, y + 4);

  y += 10;
  // Signature lines
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);

  // Umpire
  doc.line(14, y + 10, 65, y + 10);
  doc.text('Umpire Signature', 14, y + 14);

  // Service Judge
  doc.line(80, y + 10, 130, y + 10);
  doc.text('Service Judge Signature', 80, y + 14);

  // Referee
  doc.line(145, y + 10, 195, y + 10);
  doc.text('Referee / Tournament Director', 145, y + 14);

  // Save the PDF
  const filename = `Scoresheet_NV_Badminton_${match.matchNumber.replace(/\s+/g, '_')}_Court${match.courtNumber}.pdf`;
  doc.save(filename);
}
