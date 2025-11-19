/**
 * Mock Data Indicator
 * Shows a visual indicator when the app is using mock data
 */

import { Database } from 'lucide-react';
import { USE_MOCK_DATA } from '../services/apiWithMock';

export default function MockDataIndicator() {
  if (!USE_MOCK_DATA) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 md:bottom-auto md:top-4 md:left-auto md:right-4">
      <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg px-4 py-2 shadow-lg flex items-center gap-2 animate-pulse">
        <Database className="h-4 w-4 text-yellow-700" />
        <span className="text-xs font-semibold text-yellow-800">
          MOCK DATA MODE
        </span>
      </div>
    </div>
  );
}

