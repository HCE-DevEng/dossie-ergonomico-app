import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel, UnderlineType } from 'docx';
import { QuestionnaireResponse, Questionnaire, ReportConfig, Profile, QuestionnaireId, Evaluator } from '../types';
import { questionnairesData } from '../data/questionnaires';

// Helper to download any blob
function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * WORD DOCUMENT (DOCX) EXPORT
 */
export function exportToWord(
  response: QuestionnaireResponse,
  questionnaire: Questionnaire,
  config: ReportConfig,
  evaluator?: Evaluator
) {
  // Setup nice borders
  const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: 'D0D0D0' };
  const borderStyle = {
    top: thinBorder,
    bottom: thinBorder,
    left: thinBorder,
    right: thinBorder,
  };

  // Convert Hex Theme Color to exact Hex for Word (removing '#')
  const themeHex = config.themeColor.replace('#', '') || '1A365D';

  // Respondent Info Table
  const respondentRows = [
    new TableRow({
      children: [
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Colaborador:', bold: true })] })] }),
        new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: response.respondent.name })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Setor / Departamento:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: response.respondent.department })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Cargo:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: response.respondent.role })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Data de Aplicação:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: response.respondent.date })] }),
      ],
    }),
  ];

  // Optional fields
  if (response.respondent.age) {
    respondentRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Idade:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: `${response.respondent.age} anos` })] }),
      ],
    }));
  }
  if (response.respondent.gender) {
    respondentRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Gênero:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: response.respondent.gender })] }),
      ],
    }));
  }
  if (response.respondent.tenureMonths) {
    respondentRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Tempo de Serviço:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: `${response.respondent.tenureMonths} meses` })] }),
      ],
    }));
  }

  if (response.respondent.companyName) {
    respondentRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Empresa / Organização:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: response.respondent.companyName })] }),
      ],
    }));
  }
  if (response.respondent.jobDescription) {
    respondentRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Descrição Real das Atividades:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: response.respondent.jobDescription })] }),
      ],
    }));
  }
  if (response.respondent.hiredRoleActivities) {
    respondentRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Atribuições Contratuais:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: response.respondent.hiredRoleActivities })] }),
      ],
    }));
  }
  if (response.respondent.specificComplaints) {
    respondentRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Reclamações Específicas / Queixas:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: response.respondent.specificComplaints })] }),
      ],
    }));
  }
  if (response.respondent.problemComplaints) {
    respondentRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Reclamações de Problemas / Sintomas:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: response.respondent.problemComplaints })] }),
      ],
    }));
  }
  if (response.respondent.observedPosture) {
    respondentRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Postura Percebida:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: response.respondent.observedPosture })] }),
      ],
    }));
  }
  if (response.respondent.generalComments) {
    respondentRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Comentários do Avaliador:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: response.respondent.generalComments })] }),
      ],
    }));
  }

  const respondentTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderStyle,
    rows: respondentRows,
  });

  // Dimension Scores Table
  const dimRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({ shading: { fill: themeHex }, children: [new Paragraph({ children: [new TextRun({ text: 'Dimensão Avaliada', bold: true, color: 'FFFFFF' })] })] }),
        new TableCell({ shading: { fill: themeHex }, width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Pontuação', bold: true, color: 'FFFFFF' })] })] }),
        new TableCell({ shading: { fill: themeHex }, children: [new Paragraph({ children: [new TextRun({ text: 'Significado / Escopo', bold: true, color: 'FFFFFF' })] })] }),
      ],
    }),
  ];

  Object.entries(response.calculatedScores.dimensionScores).forEach(([dimension, score]) => {
    const desc = response.calculatedScores.metricsDescription?.[dimension] || '';
    dimRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: dimension, bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, text: String(score) })] }),
        new TableCell({ children: [new Paragraph({ text: desc })] }),
      ],
    }));
  });

  const dimTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderStyle,
    rows: dimRows,
  });

  // Detailed Answers Table
  const answersRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({ shading: { fill: 'F3F4F6' }, width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Questão', bold: true })] })] }),
        new TableCell({ shading: { fill: 'F3F4F6' }, width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Resposta Selecionada', bold: true })] })] }),
      ],
    }),
  ];

  questionnaire.sections.forEach(sec => {
    // Section Header row in table
    answersRows.push(new TableRow({
      children: [
        new TableCell({ columnSpan: 2, shading: { fill: 'E5E7EB' }, children: [new Paragraph({ children: [new TextRun({ text: sec.title, bold: true })] })] }),
      ],
    }));

    sec.questions.forEach(q => {
      const ansVal = response.answers[q.id];
      let ansLabel = String(ansVal);
      if (q.options) {
        const opt = q.options.find(o => o.value === Number(ansVal));
        if (opt) ansLabel = opt.label;
      }
      answersRows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: q.text })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, text: ansLabel })] }),
        ],
      }));
    });
  });

  const answersTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderStyle,
    rows: answersRows,
  });

  // Build the complete document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // A4 Width in twentieths of a point (1/1440 inch)
              height: 16838, // A4 Height
            }
          }
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: config.title || `RELATÓRIO DE AVALIAÇÃO OCUPACIONAL`,
                bold: true,
                color: themeHex,
                size: 28, // 14pt
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: config.subtitle || `Análise de ferramenta ergonômica / psicossocial: ${questionnaire.title} (${questionnaire.acronym})`,
                italics: true,
                color: '4B5563',
                size: 20, // 10pt
              }),
            ],
          }),

          // Header line
          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: '1. INFORMAÇÕES DO COLABORADOR E CONTEXTO',
                bold: true,
                size: 24, // 12pt
              }),
            ],
          }),
          respondentTable,

          new Paragraph({ spacing: { before: 400, after: 200 } }),

          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: '2. RESULTADOS E ANÁLISE DE SCORE',
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: 'Pontuação Geral Calculada: ', bold: true }),
              new TextRun({ text: `${response.calculatedScores.globalScore} `, bold: true, color: themeHex, size: 24 }),
              new TextRun({ text: questionnaire.id === 'jds' ? ' pontos de MPS' : (questionnaire.id === 'ergo_anamnese' ? '/10' : '%') }),
            ],
          }),
          dimTable,

          new Paragraph({ spacing: { before: 400, after: 200 } }),

          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: '3. DETALHAMENTO DAS RESPOSTAS',
                bold: true,
                size: 24,
              }),
            ],
          }),
          answersTable,

          new Paragraph({ spacing: { before: 400, after: 200 } }),

          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'Observações e Recomendações:',
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: 'Este relatório serve como diagnóstico de referência ergonômica e psicossocial e deve ser validado por profissional de Medicina, Ergonomia ou Psicologia Organizacional do Trabalho habilitado.',
                italics: true,
                color: '6B7280',
              }),
            ],
          }),
          ...(evaluator ? [
            new Paragraph({ spacing: { before: 400, after: 100 } }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '_____________________________________' })] }),
                        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 50 }, children: [new TextRun({ text: 'Assinatura do Colaborador', bold: true, size: 16 })] }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '_____________________________________' })] }),
                        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 50 }, children: [new TextRun({ text: evaluator.name, bold: true, size: 16 })] }),
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: [evaluator.role || 'Avaliador Técnico', evaluator.professionalId].filter(Boolean).join(' - '), size: 14, color: '6B7280' })] }),
                        ...(evaluator.organization ? [
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: evaluator.organization, size: 14, color: '6B7280' })] })
                        ] : []),
                      ],
                    }),
                  ],
                }),
              ],
            })
          ] : []),
        ],
      },
    ],
  });

  // Pack and Save
  Packer.toBlob(doc).then((blob) => {
    const safeName = response.respondent.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${questionnaire.acronym}_Relatorio_${safeName}.docx`;
    downloadBlob(blob, filename);
  });
}

/**
 * PDF EXPORT (jsPDF + autoTable)
 */
export function exportToPDF(
  response: QuestionnaireResponse,
  questionnaire: Questionnaire,
  config: ReportConfig,
  evaluator?: Evaluator
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const themeHex = config.themeColor || '#1E3A8A';

  // Extract RGB values for standard drawing Canvas
  const r = parseInt(themeHex.substring(1, 3), 16);
  const g = parseInt(themeHex.substring(3, 5), 16);
  const b = parseInt(themeHex.substring(5, 7), 16);

  // 1. PAGE HEADER / ACCENTS
  doc.rect(0, 0, 210, 15, 'F');
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, 210, 12, 'F');

  // Title on Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${questionnaire.acronym.toUpperCase()} - DOSSIÊ ERGONÔMICO & PSICOSSOCIAL`, 15, 8);

  // 2. DOCUMENT TITLE
  doc.setTextColor(r, g, b);
  doc.setFontSize(18);
  doc.text(config.title || `RELATÓRIO DE AVALIAÇÃO OCUPACIONAL`, 15, 28);

  doc.setTextColor(107, 114, 128); // Gray 500
  doc.setFont('helvetica', 'oblique');
  doc.setFontSize(10);
  doc.text(config.subtitle || `Ferramenta de Diagnóstico: ${questionnaire.title}`, 15, 34);

  // 3. RESPONDENT DETAILS
  doc.setTextColor(55, 65, 81); // Gray 700
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. Informações do Colaborador', 15, 45);

  const metaDataRows = [
    ['Colaborador', response.respondent.name, 'Data', response.respondent.date],
    ['Departamento / Setor', response.respondent.department, 'Cargo', response.respondent.role]
  ];

  if (response.respondent.age || response.respondent.gender) {
    metaDataRows.push([
      'Idade', response.respondent.age ? `${response.respondent.age} anos` : 'Não informado',
      'Gênero / Tempo Empresa', `${response.respondent.gender || '-'} / ${response.respondent.tenureMonths ? `${response.respondent.tenureMonths}m` : '-'}`
    ]);
  }

  autoTable(doc, {
    startY: 48,
    margin: { left: 15, right: 15 },
    body: metaDataRows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5, font: 'helvetica' },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [243, 244, 246], cellWidth: 40 },
      2: { fontStyle: 'bold', fillColor: [243, 244, 246], cellWidth: 30 }
    }
  });

  // Ergonomic / Occupational comments section in PDF
  const ergoRows: any[] = [];
  if (response.respondent.companyName) ergoRows.push(['Empresa / Organização', response.respondent.companyName]);
  if (response.respondent.jobDescription) ergoRows.push(['Descrição Real das Atividades', response.respondent.jobDescription]);
  if (response.respondent.hiredRoleActivities) ergoRows.push(['Atividades Contratadas', response.respondent.hiredRoleActivities]);
  if (response.respondent.specificComplaints) ergoRows.push(['Reclamações Específicas / Queixas', response.respondent.specificComplaints]);
  if (response.respondent.problemComplaints) ergoRows.push(['Reclamações de Problemas / Sintomas', response.respondent.problemComplaints]);
  if (response.respondent.observedPosture) ergoRows.push(['Postura Percebida pelo Avaliador', response.respondent.observedPosture]);
  if (response.respondent.generalComments) ergoRows.push(['Comentários Gerais do Avaliador', response.respondent.generalComments]);

  let currentYAfterDemographics = (doc as any).lastAutoTable.finalY || 70;

  if (ergoRows.length > 0) {
    currentYAfterDemographics += 8;
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Avaliação Ocupacional & Observações Ergonômicas', 15, currentYAfterDemographics);

    autoTable(doc, {
      startY: currentYAfterDemographics + 3,
      margin: { left: 15, right: 15 },
      body: ergoRows,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2, font: 'helvetica' },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [243, 244, 246], cellWidth: 55 },
        1: { cellWidth: 125 }
      }
    });
    currentYAfterDemographics = (doc as any).lastAutoTable.finalY || currentYAfterDemographics;
  }

  // 4. METRICS / CALCULATED SCORE GAUGE
  const currentY = currentYAfterDemographics + 10;
  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. Pontuações Calculadas por Dimensão', 15, currentY);

  // Main Score Gauge Box
  doc.setFillColor(243, 244, 246);
  doc.rect(15, currentY + 3, 180, 20, 'F');
  
  doc.setTextColor(r, g, b);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(`${response.calculatedScores.globalScore}`, 22, currentY + 15);
  
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const unit = questionnaire.id === 'jds' ? 'pontos de Potencial Motivacional (MPS, escala 1-343)' : (questionnaire.id === 'ergo_anamnese' ? 'pontos (escala de 1 a 10)' : '% de pontuação ergonômica global');
  doc.text(`Pontuação Geral Obtida (${unit})`, 48, currentY + 10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Análise realizada com base nas fórmulas descritas no manual científico da ferramenta.`, 48, currentY + 16);

  // Mini vertical accent bar in gauge box
  doc.setFillColor(r, g, b);
  doc.rect(15, currentY + 3, 2, 20, 'F');

  // Dimensions details table
  const dimsRows = Object.entries(response.calculatedScores.dimensionScores).map(([dimName, score]) => {
    const desc = response.calculatedScores.metricsDescription?.[dimName] || '';
    return [dimName, score, desc];
  });

  autoTable(doc, {
    startY: currentY + 28,
    margin: { left: 15, right: 15 },
    head: [['Dimensão Avaliada', 'Pontuação', 'Descrição / Significado']],
    body: dimsRows,
    theme: 'striped',
    headStyles: { fillColor: [r, g, b], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { fontStyle: 'bold', halign: 'center', cellWidth: 25 },
      2: { textColor: [100, 100, 100] }
    }
  });

  // 5. DETAILED ANSWERS TABLE
  const nextY = (doc as any).lastAutoTable.finalY + 12;

  // Let's check if the table overflows. If it's too close to bottom, add a new page
  if (nextY > 220) {
    doc.addPage();
    // Re-draw small header bar on second page
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 210, 8, 'F');
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. Respostas Detalhadas das Questões', 15, 20);
  } else {
    doc.text('3. Respostas Detalhadas das Questões', 15, nextY);
  }

  const answersRows: any[] = [];
  questionnaire.sections.forEach(sec => {
    // Add section title as a row
    answersRows.push([{ content: sec.title, colSpan: 2, styles: { fillColor: [229, 231, 235], fontStyle: 'bold' } }]);
    
    sec.questions.forEach(q => {
      const ansVal = response.answers[q.id];
      let ansLabel = String(ansVal || 'Não Respondida');
      if (q.options) {
        const opt = q.options.find(o => o.value === Number(ansVal));
        if (opt) ansLabel = opt.label;
      }
      answersRows.push([q.text, ansLabel]);
    });
  });

  autoTable(doc, {
    startY: nextY > 220 ? 24 : nextY + 3,
    margin: { left: 15, right: 15 },
    head: [['Questão Formulada', 'Resposta do Colaborador']],
    body: answersRows,
    theme: 'grid',
    headStyles: { fillColor: [75, 85, 99], textColor: [255, 255, 255] }, // Slate Head
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { halign: 'center' }
    }
  });

  // Footer / Signatures on last page
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  if (finalY > 240) {
    doc.addPage();
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 210, 8, 'F');
    drawFooterSignature(doc, 30, r, g, b, evaluator);
  } else {
    drawFooterSignature(doc, finalY, r, g, b, evaluator);
  }

  // Save the report
  const safeName = response.respondent.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${questionnaire.acronym}_Laudo_${safeName}.pdf`;
  doc.save(filename);
}

function drawFooterSignature(doc: jsPDF, startY: number, r: number, g: number, b: number, evaluator?: Evaluator) {
  // Divider line
  doc.setDrawColor(229, 231, 235);
  doc.line(15, startY, 195, startY);

  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Nota de Confidencialidade: As informações deste questionário destinam-se exclusivamente para análises', 15, startY + 6);
  doc.text('de melhoria ergonômica, saúde física e mental dos postos de trabalho em conformidade com as diretrizes vigentes.', 15, startY + 10);

  // Two signature lines
  const sigY = startY + 25;
  doc.setDrawColor(156, 163, 175);
  doc.line(25, sigY, 95, sigY);
  doc.line(115, sigY, 185, sigY);

  doc.setTextColor(55, 65, 81);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Assinatura do Colaborador', 35, sigY + 4);

  if (evaluator) {
    doc.text(evaluator.name, 115, sigY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const roleText = [evaluator.role || 'Avaliador Técnico', evaluator.professionalId].filter(Boolean).join(' - ');
    doc.text(roleText, 115, sigY + 8);
    if (evaluator.organization) {
      doc.text(evaluator.organization, 115, sigY + 11.5);
    }
  } else {
    doc.text('Avaliador Técnico / Ergonomista', 125, sigY + 4);
  }
}

// Helper to generate clinical opinion for exports
function generateClinicalOpinionForExport(responses: QuestionnaireResponse[]) {
  const elements: string[] = [];
  const recommendations: string[] = [];
  
  const nasa = responses.find(r => r.questionnaireId === 'nasa_tlx');
  const copsoq = responses.find(r => r.questionnaireId === 'copsoq_ii');
  const jds = responses.find(r => r.questionnaireId === 'jds');
  const tqwl = responses.find(r => r.questionnaireId === 'tqwl_42');

  if (nasa) {
    const score = nasa.calculatedScores.globalScore;
    if (score > 60) {
      elements.push(`Elevada sobrecarga mental e temporal de trabalho (${score} pontos no NASA-TLX), indicando iminente fadiga cognitiva.`);
      recommendations.push("Implementar pausas obrigatórias de 10 minutos a cada duas horas de esforço mental contínuo.");
    } else {
      elements.push(`Carga mental de trabalho equilibrada (${score} pontos no NASA-TLX), compatível com a capacidade adaptativa.`);
    }
  }

  if (copsoq) {
    const score = copsoq.calculatedScores.globalScore;
    if (score > 55) {
      elements.push(`Presença relevante de fatores de risco psicossociais organizacionais (${score}% no COPSOQ II), afetando o clima e a liderança.`);
      recommendations.push("Rever processos de distribuição de tarefas e canais de feedback contínuo com a coordenação imediata.");
    } else {
      elements.push(`Bom suporte social e baixo nível de estressores psicossociais organizacionais (${score}% no COPSOQ II).`);
    }
  }

  if (jds) {
    const score = jds.calculatedScores.globalScore;
    if (score < 120) {
      elements.push(`Baixo escore de potencial motivacional do cargo (${score} MPS no JDS), apontando para subutilização profissional ou falta de autonomia.`);
      recommendations.push("Enriquecer as tarefas (Job Enrichment) concedendo maior margem para tomadas de decisão estruturadas.");
    } else {
      elements.push(`Adequado potencial motivacional estrutural do cargo (${score} MPS no JDS), auxiliando no engajamento laboral.`);
    }
  }

  if (tqwl) {
    const score = tqwl.calculatedScores.globalScore;
    if (score < 50) {
      elements.push(`Qualidade de Vida no Trabalho insatisfatória (${score}% no TQWL-42), com impacto percebido na saúde geral ou no ambiente.`);
      recommendations.push("Desenvolver ações integradas de saúde ocupacional focadas na preservação do bem-estar biopsicossocial do trabalhador.");
    } else {
      elements.push(`Nível favorável de Qualidade de Vida no Trabalho (${score}% no TQWL-42), corroborando estabilidade ergonômica.`);
    }
  }

  const ergoAnamnese = responses.find(r => r.questionnaireId === 'ergo_anamnese');
  if (ergoAnamnese) {
    const score = ergoAnamnese.calculatedScores.globalScore;
    const dores = ergoAnamnese.answers['ae_dores'];
    if (score < 5) {
      elements.push(`Condições de trabalho e percepção ergonômica críticas (Nota Geral: ${score}/10 na Avaliação de Anamnese).`);
      if (dores && String(dores).trim()) {
        elements.push(`Sintomas de desconforto/dor física relatados pelo colaborador: "${dores}".`);
      }
      recommendations.push("Realizar análise ergonômica detalhada do posto de trabalho para eliminação imediata de dores e posturas inadequadas.");
    } else if (score < 8) {
      elements.push(`Avaliação de anamnese ergonômica com nível moderado de satisfação (Nota Geral: ${score}/10).`);
      if (dores && String(dores).trim()) {
        elements.push(`Queixas de desconfortos físicos secundários relatadas pelo colaborador: "${dores}".`);
      }
      recommendations.push("Ajustar a ergonomia de mobiliários ou do arranjo físico para reduzir desconfortos leves reportados.");
    } else {
      elements.push(`Excelente índice de satisfação e conforto ergonômico percebido pelo colaborador (Nota Geral: ${score}/10).`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("Manter o monitoramento ergonômico periódico anual e preservar as boas práticas vigentes no posto.");
  }

  return { elements, recommendations };
}

const getInterpretationForExport = (questionnaireId: QuestionnaireId, globalScore: number) => {
  if (questionnaireId === 'nasa_tlx') {
    if (globalScore > 75) return { text: 'Sobrecarga Crítica' };
    if (globalScore > 50) return { text: 'Carga Elevada' };
    if (globalScore > 25) return { text: 'Carga Moderada' };
    return { text: 'Baixa Sobrecarga' };
  }
  if (questionnaireId === 'copsoq_ii') {
    if (globalScore > 70) return { text: 'Risco Psicossocial Alto' };
    if (globalScore > 45) return { text: 'Risco Psicossocial Médio' };
    return { text: 'Baixo Risco (Clima Favorável)' };
  }
  if (questionnaireId === 'jds') {
    if (globalScore > 180) return { text: 'Alto Potencial Motivacional' };
    if (globalScore > 100) return { text: 'Moderado Potencial Motivacional' };
    return { text: 'Subutilização / Baixa Motivação' };
  }
  if (questionnaireId === 'tqwl_42') {
    if (globalScore > 70) return { text: 'Excelente QVT' };
    if (globalScore > 50) return { text: 'Satisfatório QVT' };
    return { text: 'Crítico / Alerta de Saúde' };
  }
  if (questionnaireId === 'ergo_anamnese') {
    if (globalScore >= 8) return { text: 'Excelente / Confortável' };
    if (globalScore >= 5) return { text: 'Satisfatório / Moderado' };
    return { text: 'Crítico / Desconforto Alto' };
  }
  return { text: 'Pontuação Realizada' };
};

// 2. EXPORT PROFILE TO WORD (.DOCX)
export function exportProfileToWord(
  profile: Profile,
  responses: QuestionnaireResponse[],
  config: ReportConfig,
  evaluator?: Evaluator
) {
  const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: 'D0D0D0' };
  const borderStyle = {
    top: thinBorder,
    bottom: thinBorder,
    left: thinBorder,
    right: thinBorder,
  };

  const themeHex = config.themeColor.replace('#', '') || '1A365D';
  const opinion = generateClinicalOpinionForExport(responses);

  // Demographic details rows
  const profileRows = [
    new TableRow({
      children: [
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Colaborador:', bold: true })] })] }),
        new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: profile.name })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Setor / Departamento:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: profile.department })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Cargo / Função:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: profile.role })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Idade:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: profile.age ? `${profile.age} anos` : 'Não informada' })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Gênero:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: profile.gender || 'Não informado' })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Tempo de Empresa:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: profile.tenureMonths ? `${profile.tenureMonths} meses` : 'Não informado' })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Grau de Instrução:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: profile.education || 'Não informado' })] }),
      ],
    }),
  ];

  // Extract ergonomic / occupational comment fields if present in any response
  const validResp = responses.find(r => r.respondent.companyName || r.respondent.jobDescription || r.respondent.specificComplaints);
  const companyName = validResp?.respondent.companyName || profile.companyName;
  const jobDescription = validResp?.respondent.jobDescription || profile.jobDescription;
  const hiredRoleActivities = validResp?.respondent.hiredRoleActivities || profile.hiredRoleActivities;
  const specificComplaints = validResp?.respondent.specificComplaints || profile.specificComplaints;
  const problemComplaints = validResp?.respondent.problemComplaints || profile.problemComplaints;
  const observedPosture = validResp?.respondent.observedPosture || profile.observedPosture;
  const generalComments = validResp?.respondent.generalComments || profile.generalComments;

  if (companyName) {
    profileRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Empresa / Organização:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: companyName })] }),
      ],
    }));
  }
  if (jobDescription) {
    profileRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'O que faz? (Descrição Real):', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: jobDescription })] }),
      ],
    }));
  }
  if (hiredRoleActivities) {
    profileRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Atribuições Contratuais:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: hiredRoleActivities })] }),
      ],
    }));
  }
  if (specificComplaints) {
    profileRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Reclamações Específicas / Queixas:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: specificComplaints })] }),
      ],
    }));
  }
  if (problemComplaints) {
    profileRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Reclamações de Problemas / Sintomas:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: problemComplaints })] }),
      ],
    }));
  }
  if (observedPosture) {
    profileRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Postura Percebida:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: observedPosture })] }),
      ],
    }));
  }
  if (generalComments) {
    profileRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Comentários do Avaliador:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: generalComments })] }),
      ],
    }));
  }

  const profileTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderStyle,
    rows: profileRows,
  });

  const children: any[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'DOSSIÊ DE AVALIAÇÃO ERGONÔMICA E PSICOSSOCIAL CONSOLIDADA',
          bold: true,
          color: themeHex,
          size: 28,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Relatório Técnico Unificado compilando as 4 metodologias científicas para o colaborador`,
          italics: true,
          color: '4B5563',
          size: 20,
        }),
      ],
    }),

    // Section 1
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: '1. INFORMAÇÕES DO COLABORADOR E CONTEXTO',
          bold: true,
          size: 24,
        }),
      ],
    }),
    profileTable,
    new Paragraph({ spacing: { before: 400, after: 200 } }),

    // Section 2 - Clinical Opinion
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: '2. PARECER TÉCNICO CONSOLIDADO',
          bold: true,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 150 },
      children: [
        new TextRun({ text: 'Fatores Identificados nos Instrumentos Científicos:', bold: true, color: themeHex }),
      ],
    }),
  ];

  opinion.elements.forEach(el => {
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: '• ', bold: true, color: themeHex }),
          new TextRun({ text: el }),
        ],
      })
    );
  });

  children.push(
    new Paragraph({
      spacing: { before: 200, after: 150 },
      children: [
        new TextRun({ text: 'Recomendações e Diretrizes de Engenharia Humana:', bold: true, color: '0F766E' }),
      ],
    })
  );

  opinion.recommendations.forEach((rec, idx) => {
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: `${idx + 1}. `, bold: true, color: '0F766E' }),
          new TextRun({ text: rec }),
        ],
      })
    );
  });

  children.push(new Paragraph({ spacing: { before: 400, after: 200 } }));

  // Section 3: Detailed Methods
  children.push(
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: '3. RESULTADOS POR INSTRUMENTO DE AVALIAÇÃO',
          bold: true,
          size: 24,
        }),
      ],
    })
  );

  responses.forEach((resp) => {
    const q = questionnairesData.find(item => item.id === resp.questionnaireId);
    if (!q) return;

    const interp = getInterpretationForExport(resp.questionnaireId, resp.calculatedScores.globalScore);

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
        children: [
          new TextRun({
            text: `${q.title} (${q.acronym})`,
            bold: true,
            color: themeHex,
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({ text: 'Pontuação Geral Obtida: ', bold: true }),
          new TextRun({ text: `${resp.calculatedScores.globalScore}${resp.questionnaireId === 'jds' ? ' pontos de MPS' : (resp.questionnaireId === 'ergo_anamnese' ? '/10' : '%')} `, bold: true, color: themeHex }),
          new TextRun({ text: ` | Classificação: `, italics: true }),
          new TextRun({ text: interp.text, bold: true }),
        ],
      })
    );

    // Dimension Table
    const dimRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ shading: { fill: themeHex }, width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Dimensão', bold: true, color: 'FFFFFF' })] })] }),
          new TableCell({ shading: { fill: themeHex }, width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Pontuação', bold: true, color: 'FFFFFF' })] })] }),
          new TableCell({ shading: { fill: themeHex }, width: { size: 45, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Escopo / Descrição', bold: true, color: 'FFFFFF' })] })] }),
        ],
      }),
    ];

    Object.entries(resp.calculatedScores.dimensionScores).forEach(([dimension, score]) => {
      const desc = resp.calculatedScores.metricsDescription?.[dimension] || '';
      dimRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: dimension, bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, text: `${score}${resp.questionnaireId === 'jds' ? '' : (resp.questionnaireId === 'ergo_anamnese' ? '/10' : '%')}` })] }),
            new TableCell({ children: [new Paragraph({ text: desc })] }),
          ],
        })
      );
    });

    const dimTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borderStyle,
      rows: dimRows,
    });

    children.push(dimTable);
    children.push(new Paragraph({ spacing: { before: 150, after: 100 } }));

    // Answers Table
    const ansRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ shading: { fill: 'F3F4F6' }, width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Questão Formulada', bold: true })] })] }),
          new TableCell({ shading: { fill: 'F3F4F6' }, width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Resposta Selecionada', bold: true })] })] }),
        ],
      }),
    ];

    q.sections.forEach(sec => {
      ansRows.push(
        new TableRow({
          children: [
            new TableCell({ columnSpan: 2, shading: { fill: 'E5E7EB' }, children: [new Paragraph({ children: [new TextRun({ text: sec.title, bold: true })] })] }),
          ],
        })
      );

      sec.questions.forEach(quest => {
        const ansVal = resp.answers[quest.id];
        let ansLabel = String(ansVal !== undefined ? ansVal : '-');
        if (quest.options) {
          const opt = quest.options.find(o => o.value === Number(ansVal));
          if (opt) ansLabel = opt.label;
        }

        ansRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: quest.text })] }),
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, text: ansLabel })] }),
            ],
          })
        );
      });
    });

    const ansTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borderStyle,
      rows: ansRows,
    });

    children.push(ansTable);
    children.push(new Paragraph({ spacing: { before: 200, after: 200 } }));
  });

  // Confidentiality and Signatures
  children.push(
    new Paragraph({ spacing: { before: 400, after: 100 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Nota de Confidencialidade e Responsabilidade Técnica:',
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: 'Este dossiê integrado serve como diagnóstico referencial de ergonomia física e psicossocial do trabalho (conforme diretrizes vigentes, NR-17 e correlatas), devendo ser validado pelo profissional ou comitê de ergonomia e saúde ocupacional.',
          italics: true,
          color: '6B7280',
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '_____________________________________' })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 50 }, children: [new TextRun({ text: 'Assinatura do Colaborador', bold: true, size: 18 })] }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '_____________________________________' })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 50 }, children: [new TextRun({ text: evaluator ? evaluator.name : 'Avaliador Técnico / Ergonomista', bold: true, size: 18 })] }),
                ...(evaluator ? [
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: [evaluator.role || 'Avaliador Técnico', evaluator.professionalId].filter(Boolean).join(' - '), size: 14, color: '6B7280' })] }),
                  ...(evaluator.organization ? [
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: evaluator.organization, size: 14, color: '6B7280' })] })
                  ] : []),
                ] : []),
              ],
            }),
          ],
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,
              height: 16838,
            },
          },
        },
        children,
      },
    ],
  });

  Packer.toBlob(doc).then((blob) => {
    const safeName = profile.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Dossie_Integrado_${safeName}.docx`;
    downloadBlob(blob, filename);
  });
}

// 3. EXPORT PROFILE TO PDF
export function exportProfileToPDF(
  profile: Profile,
  responses: QuestionnaireResponse[],
  config: ReportConfig,
  evaluator?: Evaluator
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const hexColor = config.themeColor || '#1E3A8A';
  const r = parseInt(hexColor.slice(1, 3), 16) || 30;
  const g = parseInt(hexColor.slice(3, 5), 16) || 58;
  const b = parseInt(hexColor.slice(5, 7), 16) || 138;

  const opinion = generateClinicalOpinionForExport(responses);

  // PAGE 1: COVER / MAIN SUMMARY & OPINION
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, 210, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DOSSIÊ ERGONÔMICO & PSICOSSOCIAL INTEGRADO', 15, 18);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Laudo Clínico de Engenharia Humana & Diagnóstico Unificado de Instrumentos Científicos', 15, 25);
  doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 15, 31);

  doc.setTextColor(r, g, b);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. INFORMAÇÕES DO COLABORADOR', 15, 52);

  autoTable(doc, {
    startY: 56,
    body: [
      ['Nome do Colaborador', profile.name, 'Cargo / Função', profile.role],
      ['Setor / Departamento', profile.department, 'Idade', profile.age ? `${profile.age} anos` : 'Não informada'],
      ['Gênero', profile.gender || 'Não informado', 'Tempo de Empresa', profile.tenureMonths ? `${profile.tenureMonths} meses` : 'Não informado'],
      ['Estado Civil', profile.maritalStatus || 'Não informado', 'Grau de Instrução', profile.education || 'Não informado']
    ],
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5, font: 'helvetica' },
    columnStyles: {
      0: { fillColor: [243, 244, 246], fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 65 },
      2: { fillColor: [243, 244, 246], fontStyle: 'bold', cellWidth: 35 },
      3: { cellWidth: 55 }
    }
  });

  // Extract ergonomic / occupational comments for PDF
  const validRespondent = responses.find(r => r.respondent.companyName || r.respondent.jobDescription || r.respondent.specificComplaints)?.respondent || profile;

  const ergoRows: any[] = [];
  if (validRespondent.companyName) ergoRows.push(['Empresa / Organização', validRespondent.companyName]);
  if (validRespondent.jobDescription) ergoRows.push(['Descrição Real das Atividades', validRespondent.jobDescription]);
  if (validRespondent.hiredRoleActivities) ergoRows.push(['Atividades Contratadas', validRespondent.hiredRoleActivities]);
  if (validRespondent.specificComplaints) ergoRows.push(['Reclamações Específicas / Queixas', validRespondent.specificComplaints]);
  if (validRespondent.problemComplaints) ergoRows.push(['Reclamações de Problemas / Sintomas', validRespondent.problemComplaints]);
  if (validRespondent.observedPosture) ergoRows.push(['Postura Percebida pelo Avaliador', validRespondent.observedPosture]);
  if (validRespondent.generalComments) ergoRows.push(['Comentários Gerais do Avaliador', validRespondent.generalComments]);

  let lastY = (doc as any).lastAutoTable.finalY || 90;

  if (ergoRows.length > 0) {
    autoTable(doc, {
      startY: lastY + 6,
      body: [
        [{ content: 'AVALIAÇÃO OCUPACIONAL & OBSERVAÇÕES ERGONÔMICAS', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [243, 244, 246], textColor: [r, g, b], fontSize: 9 } }],
        ...ergoRows
      ],
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2, font: 'helvetica' },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 55 },
        1: { cellWidth: 135 }
      }
    });
    lastY = (doc as any).lastAutoTable.finalY || lastY;
  }

  autoTable(doc, {
    startY: lastY + 8,
    body: [
      [{ content: '2. PARECER TÉCNICO CONSOLIDADO (DIAGNÓSTICO AGREGADO)', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [r, g, b], textColor: [255, 255, 255], fontSize: 9.5 } }],
      ...opinion.elements.map(el => ['•', el]),
      [{ content: '3. DIRETRIZES E RECOMENDAÇÕES DE ENGENHARIA HUMANA', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [15, 118, 110], textColor: [255, 255, 255], fontSize: 9.5 } }],
      ...opinion.recommendations.map((rec, idx) => [`${idx + 1}.`, rec])
    ],
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 3, font: 'helvetica', valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 8, fontStyle: 'bold', textColor: [r, g, b], halign: 'center' },
      1: { textColor: [55, 65, 81] }
    }
  });

  // SUBSEQUENT PAGES: DETAILS FOR EACH QUESTIONNAIRE
  responses.forEach((resp) => {
    const q = questionnairesData.find(item => item.id === resp.questionnaireId);
    if (!q) return;

    doc.addPage();

    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 210, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dossiê Técnico Integrado • Colaborador: ${profile.name}`, 15, 9);

    doc.setTextColor(r, g, b);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`AVALIAÇÃO DE MÉTODO: ${q.title.toUpperCase()} (${q.acronym})`, 15, 26);

    const interp = getInterpretationForExport(resp.questionnaireId, resp.calculatedScores.globalScore);

    autoTable(doc, {
      startY: 30,
      body: [
        ['Escore Global Resolvido', `${resp.calculatedScores.globalScore}${resp.questionnaireId === 'jds' ? ' (MPS)' : (resp.questionnaireId === 'ergo_anamnese' ? '/10' : '%')}`, 'Classificação Clínica', interp.text],
        ['Origem / Referência', q.origin, 'Instrumento Científico', q.acronym]
      ],
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.5, font: 'helvetica' },
      columnStyles: {
        0: { fillColor: [243, 244, 246], fontStyle: 'bold', cellWidth: 40 },
        1: { fontStyle: 'bold', textColor: [r, g, b], cellWidth: 45 },
        2: { fillColor: [243, 244, 246], fontStyle: 'bold', cellWidth: 40 },
        3: { fontStyle: 'bold', cellWidth: 65 }
      }
    });

    const dimStartY = (doc as any).lastAutoTable.finalY + 6;

    doc.setTextColor(31, 41, 55);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Análise Detalhada por Dimensão do Construto:', 15, dimStartY);

    const dimRows = Object.entries(resp.calculatedScores.dimensionScores).map(([dim, score]) => {
      const desc = resp.calculatedScores.metricsDescription?.[dim] || '';
      return [dim, `${score}${resp.questionnaireId === 'jds' ? '' : (resp.questionnaireId === 'ergo_anamnese' ? '/10' : '%')}`, desc];
    });

    autoTable(doc, {
      startY: dimStartY + 3,
      head: [['Dimensão Avaliada', 'Pontuação', 'Significado / Descrição']],
      body: dimRows,
      theme: 'striped',
      headStyles: { fillColor: [r, g, b], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold' },
        1: { cellWidth: 20, halign: 'center', fontStyle: 'bold', textColor: [r, g, b] },
        2: { cellWidth: 125 }
      }
    });

    const ansStartY = (doc as any).lastAutoTable.finalY + 6;

    doc.setTextColor(31, 41, 55);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Lista Completa de Respostas ao Questionário:', 15, ansStartY);

    const ansRows: any[] = [];
    q.sections.forEach(sec => {
      ansRows.push([{ content: sec.title.toUpperCase(), colSpan: 2, styles: { fillColor: [243, 244, 246], fontStyle: 'bold', textColor: [55, 65, 81] } }]);
      sec.questions.forEach(quest => {
        const ansVal = resp.answers[quest.id];
        let ansLabel = String(ansVal !== undefined ? ansVal : '-');
        if (quest.options) {
          const opt = quest.options.find(o => o.value === Number(ansVal));
          if (opt) ansLabel = opt.label;
        }
        ansRows.push([quest.text, ansLabel]);
      });
    });

    autoTable(doc, {
      startY: ansStartY + 3,
      head: [['Questão Formulada', 'Resposta Registrada']],
      body: ansRows,
      theme: 'grid',
      headStyles: { fillColor: [75, 85, 99], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 2, font: 'helvetica' },
      columnStyles: {
        0: { cellWidth: 140 },
        1: { cellWidth: 50, halign: 'center', fontStyle: 'bold' }
      }
    });
  });

  const finalY = (doc as any).lastAutoTable.finalY || 100;
  if (finalY > 150) {
    doc.addPage();
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 210, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dossiê Técnico Integrado • Colaborador: ${profile.name}`, 15, 9);
    drawFooterSignature(doc, 40, r, g, b, evaluator);
  } else {
    drawFooterSignature(doc, finalY + 15, r, g, b, evaluator);
  }

  const safeName = profile.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Dossie_Integrado_${safeName}.pdf`);
}