import { useState, useRef } from 'react';
import { Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { storage } from '../../lib/storage';
import { useToast } from '../../hooks/useToast';

export function DataImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; count?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setImportResult(null);
    setIsImporting(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const requiredKeys = ['transactions', 'workouts', 'meals', 'bodyMetrics', 'goals', 'settings'];
      const hasValidStructure = requiredKeys.some((key) => key in data) || Array.isArray(data);

      if (!hasValidStructure && !Array.isArray(data)) {
        throw new Error('Invalid file format. Please select a LifeSync Pro export file.');
      }

      await storage.importAll(data);

      const itemCount =
        (Array.isArray(data.transactions) ? data.transactions.length : 0) +
        (Array.isArray(data.workouts) ? data.workouts.length : 0) +
        (Array.isArray(data.meals) ? data.meals.length : 0);

      setImportResult({ success: true, count: itemCount });
      addToast(`Successfully imported ${itemCount} items.`, 'success');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import data';
      setError(message);
      addToast(message, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-purple-400" />
          Import Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-400">
          Restore your data from a LifeSync Pro JSON export file. This will merge with your existing data.
        </p>

        <div
          className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-purple-500/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileJson className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 mb-1">Click to select a file or drag and drop</p>
          <p className="text-xs text-gray-500">JSON files only</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {isImporting && (
          <div className="flex items-center justify-center gap-2 text-purple-400">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            Importing data...
          </div>
        )}

        {importResult?.success && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            Successfully imported {importResult.count} items!
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <p className="text-xs text-gray-500">
          Note: Imported data will be merged with existing data. Duplicate items may be created.
        </p>
      </CardContent>
    </Card>
  );
}
