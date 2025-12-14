import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Investment } from '@/types';
import { formatCurrency } from './utils';

export const generateInvestmentPDF = (investment: Investment) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("Ficha de Inversión", 20, 20);

    // Header Details
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, 20, 30);

    // Main Info Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.rect(20, 40, 170, 45, 'FD');

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`${investment.name}`, 25, 50);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`${investment.symbol} • ${investment.type}`, 25, 58);

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`Estado: ${investment.status === 'Simulation' ? 'Simulación' : 'Activa'}`, 150, 50);

    // Financial Data Table
    autoTable(doc, {
        startY: 90,
        head: [['Concepto', 'Valor']],
        body: [
            ['Fecha de Compra', new Date(investment.purchaseDate).toLocaleDateString()],
            ['Cantidad', Number(investment.quantity).toLocaleString('es-ES')],
            ['Precio de Compra', formatCurrency(investment.buyPrice)],
            ['Precio Actual', investment.currentPrice ? formatCurrency(investment.currentPrice) : '-'],
            ['Total Invertido', formatCurrency(investment.totalInvested)],
            ['Valor Actual (Aprox)', investment.currentPrice ? formatCurrency(investment.quantity * investment.currentPrice) : '-']
        ],
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 11 }
    });

    // Notes Section
    if (investment.notes) {
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        const finalY = (doc as any).lastAutoTable.finalY + 20;
        doc.text("Notas", 20, finalY);

        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);

        const splitNotes = doc.splitTextToSize(investment.notes, 170);
        doc.text(splitNotes, 20, finalY + 10);
    }

    // Save
    doc.save(`Ficha_${investment.symbol}_${new Date().toISOString().split('T')[0]}.pdf`);
};
