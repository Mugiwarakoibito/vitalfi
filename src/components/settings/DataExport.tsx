import { useState } from 'react';
import { Download, FileJson, FileText, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { storage } from '../../lib/storage';
import { useToast } from '../../hooks/useToast';

type ExportFormat = 'json' | 'csv';

export function DataExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const { addToast } = useToast();

  const exportData = async (format: ExportFormat) => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const data = await storage.exportAll();

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `vitalfi-export-${Date.now()}.json`);
      } else {
        const csvContent = convertToCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        downloadBlob(blob, `vitalfi-export-${Date.now()}.csv`);
      }

      setExportSuccess(true);
      addToast(`Data exported as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      addToast('Failed to export data. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: Record<string, unknown>): string => {
    const rows: string[] = [];

    if (data.transactions && Array.isArray(data.transactions)) {
      rows.push('=== TRANSACTIONS ===');
      rows.push('Date,Description,Amount,Category,Type');
      (data.transactions as Record<string, string|number>[]).forEach((t) => {
        rows.push(`${t.date},"${t.description}",${t.amount},${t.category},${t.type}`);
      });
      rows.push('');
    }

    if (data.workouts && Array.isArray(data.workouts)) {
      rows.push('=== WORKOUTS ===');
      rows.push('Date,Type,Duration,Exercises');
      (data.workouts as Record<string, unknown>[]).forEach((w) => {
        const exerciseCount = Array.isArray(w.exercises) ? w.exercises.length : 0;
        rows.push(`${w.date},${w.type},${w.duration},${exerciseCount} exercises`);
      });
      rows.push('');
    }

    if (data.meals && Array.isArray(data.meals)) {
      rows.push('=== MEALS ===');
      rows.push('Date,Name,Calories,Protein,Carbs,Fat');
      (data.meals as Record<string, string|number>[]).forEach((m) => {
        rows.push(`${m.date},"${m.name}",${m.calories},${m.protein},${m.carbs},${m.fat}`);
      });
      rows.push('');
    }

    if (data.goals && Array.isArray(data.goals)) {
      rows.push('=== GOALS ===');
      rows.push('Name,Type,Target,Current,Deadline');
      (data.goals as Record<string, string|number>[]).forEach((g) => {
        rows.push(`"${g.name}",${g.type},${g.target},${g.current},${g.deadline}`);
      });
    }

    return rows.join('\n');
  };

  return (
    <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5 text-purple-400" />
          Export Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-400">
          Download a copy of all your data. You can choose between JSON (full data, for backup/import)
          or CSV (spreadsheet format, for viewing in Excel or Google Sheets).
        </p>

        <div className="flex gap-3">
          <Button
            variant="default"
            onClick={() => exportData('json')}
            isLoading={isExporting}
            className="flex-1"
          >
            <FileJson className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button
            variant="default"
            onClick={() => exportData('csv')}
            isLoading={isExporting}
            className="flex-1"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {exportSuccess && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            Export completed successfully!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
