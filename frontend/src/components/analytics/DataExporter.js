// Data Export Component for Analytics (PDF/CSV only)
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Calendar,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import ModernButton from '../ModernButton';
import GradientText from '../GradientText';

/**
 * Data Exporter Component
 * Handles exporting analytics data in PDF and CSV formats
 */
export const DataExporter = ({ 
  analyticsData, 
  className = '',
  onExportComplete,
  onExportError 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [selectedFormats, setSelectedFormats] = useState(['pdf']);
  const [exportOptions, setExportOptions] = useState({
    includeInsights: true,
    includeComparisons: true,
    dateRange: 'all',
  });

  // Export format options (JSON removed)
  const formatOptions = [
    {
      id: 'pdf',
      label: 'PDF Report',
      description: 'Relatório profissional em PDF',
      icon: FileText,
      color: 'purple'
    },
    {
      id: 'csv',
      label: 'CSV Report',
      description: 'Planilha CSV para Excel',
      icon: FileSpreadsheet,
      color: 'green'
    }
  ];

  /**
   * Generate CSV Report
   */
  const generateCSVReport = () => {
    if (!analyticsData) return '';

    const csvData = [];
    
    // Header
    csvData.push(['Relatório de Analytics - Scribo']);
    csvData.push([`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`]);
    csvData.push(['']); // Empty row

    // Performance Summary
    if (exportOptions.includeInsights && analyticsData.performanceMetrics) {
      csvData.push(['=== RESUMO DE PERFORMANCE ===']);
      const pm = analyticsData.performanceMetrics;
      csvData.push(['Métrica', 'Valor']);
      csvData.push(['Pontuação Média', pm.averageScore?.toFixed(2) || '0']);
      csvData.push(['Maior Pontuação', pm.highestScore || '0']);
      csvData.push(['Menor Pontuação', pm.lowestScore || '0']);
      csvData.push(['Palavras Médias', Math.round(pm.averageWords || 0)]);
      csvData.push(['Total de Palavras', pm.totalWords || '0']);
      csvData.push(['Taxa de Melhoria (%)', pm.improvementRate?.toFixed(2) || '0']);
      csvData.push(['']); // Empty row
    }

    // Competency Analysis
    if (exportOptions.includeInsights && analyticsData.competencyAnalysis) {
      csvData.push(['=== ANÁLISE POR COMPETÊNCIA ===']);
      csvData.push(['Competência', 'Pontuação Média', 'Tendência']);
      
      Object.entries(analyticsData.competencyAnalysis).forEach(([comp, data]) => {
        if (data && typeof data === 'object') {
          csvData.push([
            comp.replace('competency', 'Competência '),
            data.averageScore?.toFixed(2) || '0',
            data.trend || 'Estável'
          ]);
        }
      });
      csvData.push(['']); // Empty row
    }

    // Writing Patterns
    if (exportOptions.includeComparisons && analyticsData.writingPatterns) {
      csvData.push(['=== PADRÕES DE ESCRITA ===']);
      csvData.push(['Padrão', 'Frequência', 'Impacto na Nota']);
      
      analyticsData.writingPatterns.forEach(pattern => {
        csvData.push([
          pattern.pattern || 'N/A',
          pattern.frequency || '0',
          pattern.scoreImpact?.toFixed(2) || '0'
        ]);
      });
    }

    return csvData.map(row => 
      Array.isArray(row) ? row.join(',') : row
    ).join('\n');
  };

  /**
   * Generate PDF Report
   */
  const generatePDFReport = () => {
    if (!analyticsData) return null;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(139, 92, 246); // Purple color
    doc.text('Relatório de Evolução - Scribo', margin, 30);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, 45);

    let yPosition = 65;

    // Performance Metrics
    if (exportOptions.includeInsights && analyticsData.performanceMetrics) {
      const pm = analyticsData.performanceMetrics;
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Métricas de Performance', margin, yPosition);
      yPosition += 15;

      const performanceData = [
        ['Pontuação Média', pm.averageScore?.toFixed(1) || '0'],
        ['Redações Escritas', pm.totalEssays?.toString() || '0'],
        ['Palavras Totais', pm.totalWords?.toLocaleString() || '0'],
        ['Média de Palavras', Math.round(pm.averageWords || 0).toString()],
        ['Taxa de Melhoria', `${pm.improvementRate?.toFixed(1) || 0}%`],
        ['Maior Pontuação', pm.highestScore?.toString() || '0'],
        ['Menor Pontuação', pm.lowestScore?.toString() || '0']
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Métrica', 'Valor']],
        body: performanceData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [139, 92, 246] }
      });

      yPosition = doc.lastAutoTable.finalY + 20;
    }

    // Progress Summary
    if (exportOptions.includeComparisons && analyticsData.performanceMetrics?.progressTrend?.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Evolução das Pontuações', margin, yPosition);
      yPosition += 15;

      const progressData = analyticsData.performanceMetrics.progressTrend.map((point, index) => [
        `Redação ${index + 1}`,
        point.y?.toString() || '0',
        new Date(point.date).toLocaleDateString('pt-BR')
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Redação', 'Pontuação', 'Data']],
        body: progressData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [6, 182, 212] }
      });

      yPosition = doc.lastAutoTable.finalY + 20;
    }

    // Insights
    if (exportOptions.includeInsights && analyticsData.insights?.length > 0) {
      // Check if we need a new page
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Insights Personalizados', margin, yPosition);
      yPosition += 15;

      analyticsData.insights.forEach((insight, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }

        const typeEmoji = insight.type === 'strength' ? '✅' : insight.type === 'improvement' ? '⚠️' : '💡';
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`${typeEmoji} ${insight.title}`, margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        const splitDescription = doc.splitTextToSize(insight.description, pageWidth - 2 * margin);
        doc.text(splitDescription, margin, yPosition);
        yPosition += splitDescription.length * 5 + 10;
      });
    }

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${totalPages} - Scribo Analytics`, pageWidth - margin - 50, doc.internal.pageSize.height - 10);
    }

    return doc;
  };

  /**
   * Download file
   */
  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  /**
   * Handle Export
   */
  const handleExport = async () => {
    if (!analyticsData) {
      setExportStatus({ type: 'error', message: 'Nenhum dado disponível para exportar' });
      onExportError?.('Nenhum dado disponível');
      return;
    }

    setIsExporting(true);
    setExportStatus({ type: 'loading', message: 'Preparando exportação...' });

    try {
      const timestamp = new Date().toISOString().split('T')[0];

      for (const format of selectedFormats) {
        let content, filename, mimeType;

        switch (format) {
          case 'pdf':
            const pdfDoc = generatePDFReport();
            if (pdfDoc) {
              filename = `relatorio-evolucao-${timestamp}.pdf`;
              pdfDoc.save(filename);
            }
            continue;

          case 'csv':
            content = generateCSVReport();
            filename = `analytics-report-${timestamp}.csv`;
            mimeType = 'text/csv;charset=utf-8;';
            break;

          default:
            continue;
        }

        if (content) {
          downloadFile(content, filename, mimeType);
        }
      }

      setExportStatus({ 
        type: 'success', 
        message: `Exportação concluída! ${selectedFormats.length} arquivo(s) baixado(s).` 
      });
      
      onExportComplete?.(selectedFormats);

      // Clear status after 3 seconds
      setTimeout(() => setExportStatus(null), 3000);

    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({ 
        type: 'error', 
        message: `Erro na exportação: ${error.message}` 
      });
      onExportError?.(error.message);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Toggle format selection
   */
  const toggleFormat = (formatId) => {
    setSelectedFormats(prev => 
      prev.includes(formatId)
        ? prev.filter(id => id !== formatId)
        : [...prev, formatId]
    );
  };

  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            <GradientText>Exportar Dados</GradientText>
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Baixe seus dados de analytics em diferentes formatos
          </p>
        </div>
      </div>

      {/* Format Selection */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Formatos de Exportação:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {formatOptions.map((format) => {
            const Icon = format.icon;
            const isSelected = selectedFormats.includes(format.id);
            
            return (
              <motion.button
                key={format.id}
                onClick={() => toggleFormat(format.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? `border-${format.color}-500 bg-${format.color}-50 dark:bg-${format.color}-900/20`
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${
                    isSelected ? `text-${format.color}-600` : 'text-gray-500'
                  }`} />
                  <div>
                    <div className={`font-medium ${
                      isSelected ? `text-${format.color}-900 dark:text-${format.color}-100` : 'text-gray-900 dark:text-white'
                    }`}>
                      {format.label}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {format.description}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle className={`w-4 h-4 text-${format.color}-600 ml-auto`} />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Export Options */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Opções de Exportação:
        </h4>
        <div className="space-y-3">
          {[
            { key: 'includeInsights', label: 'Incluir insights e métricas' },
            { key: 'includeComparisons', label: 'Incluir comparações e padrões' }
          ].map((option) => (
            <label key={option.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={exportOptions[option.key]}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  [option.key]: e.target.checked
                }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Status Message */}
      {exportStatus && (
        <motion.div
          className={`p-3 rounded-lg mb-4 flex items-center gap-2 ${
            exportStatus.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
            exportStatus.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
          }`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {exportStatus.type === 'loading' && <Loader className="w-4 h-4 animate-spin" />}
          {exportStatus.type === 'success' && <CheckCircle className="w-4 h-4" />}
          {exportStatus.type === 'error' && <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{exportStatus.message}</span>
        </motion.div>
      )}

      {/* Export Button */}
      <ModernButton
        onClick={handleExport}
        disabled={isExporting || selectedFormats.length === 0 || !analyticsData}
        className="w-full"
        variant="primary"
      >
        {isExporting ? (
          <>
            <Loader className="w-4 h-4 animate-spin mr-2" />
            Exportando...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Exportar Dados ({selectedFormats.length} formato{selectedFormats.length !== 1 ? 's' : ''})
          </>
        )}
      </ModernButton>

      {/* Help Text */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        Os arquivos serão baixados automaticamente para sua pasta de Downloads
      </p>
    </motion.div>
  );
};

export default DataExporter;