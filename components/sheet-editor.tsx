'use client';

import React, { memo, useEffect, useMemo, useState } from 'react';
import DataGrid, { textEditor } from 'react-data-grid';
import { parse, unparse } from 'papaparse';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useUserMode } from './mode-toggle';

import 'react-data-grid/lib/styles.css';

type SheetEditorProps = {
  content: string;
  saveContent: (content: string, isCurrentVersion: boolean) => void;
  status: string;
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  columns?: any[];
};

const MIN_ROWS = 334;
const MIN_COLS = 4;

const PureSpreadsheetEditor = ({
  content,
  saveContent,
  status,
  isCurrentVersion,
  columns: customColumns,
}: SheetEditorProps) => {
  const { theme } = useTheme();
  const { mode } = useUserMode();
  const isSupplierMode = mode === 'supplier';

  const parseData = useMemo(() => {
    if (!content) return Array(MIN_ROWS).fill(Array(MIN_COLS).fill(''));
    const result = parse<string[]>(content, { skipEmptyLines: true });

    const paddedData = result.data.map((row) => {
      const paddedRow = [...row];
      while (paddedRow.length < MIN_COLS) {
        paddedRow.push('');
      }
      return paddedRow;
    });

    while (paddedData.length < MIN_ROWS) {
      paddedData.push(Array(MIN_COLS).fill(''));
    }

    return paddedData;
  }, [content]);

  const columns = useMemo(() => {
    if (customColumns) return customColumns;
    const rowNumberColumn = {
      key: 'rowNumber',
      name: '',
      frozen: true,
      width: 50,
      renderCell: ({ rowIdx }: { rowIdx: number }) => rowIdx + 1,
      cellClass: 'border-t border-r dark:bg-zinc-950 dark:text-zinc-50',
      headerCellClass: 'border-t border-r dark:bg-zinc-900 dark:text-zinc-50',
    };

    const columnDefinitions = [
      { key: '0', name: 'ID', width: 240 },
      { key: '1', name: 'Question', width: 250 },
      { key: '2', name: 'Answer', width: 250 },
      { key: '3', name: 'Source', width: 150 }
    ];

    const dataColumns = columnDefinitions.map((col, i) => ({
      ...col,
      renderEditCell: textEditor,
      cellClass: (row: any) => {
        // For supplier mode: highlight empty Answer cells in red
        const isEmpty = i === 2 && (!row[col.key] || row[col.key].trim() === '');
        const isEmptyHighlight = isSupplierMode && isEmpty 
          ? 'bg-red-50 dark:bg-red-900/30' 
          : '';
        
        return cn(`border-t dark:bg-zinc-950 dark:text-zinc-50 ${isEmptyHighlight}`, {
        'border-l': i !== 0,
        });
      },
      headerCellClass: cn(`border-t dark:bg-zinc-900 dark:text-zinc-50`, {
        'border-l': i !== 0,
      }),
    }));

    return [rowNumberColumn, ...dataColumns];
  }, [customColumns, isSupplierMode]);

  const initialRows = useMemo(() => {
    return parseData.map((row, rowIndex) => {
      const rowData: any = {
        id: rowIndex,
        rowNumber: rowIndex + 1,
      };

      columns.slice(1).forEach((col, colIndex) => {
        rowData[col.key] = row[colIndex] || '';
      });

      return rowData;
    });
  }, [parseData, columns]);

  const [localRows, setLocalRows] = useState(initialRows);

  useEffect(() => {
    setLocalRows(initialRows);
  }, [initialRows]);

  const generateCsv = (data: any[][]) => {
    return unparse(data);
  };

  const handleRowsChange = (newRows: any[]) => {
    setLocalRows(newRows);

    const updatedData = newRows.map((row) => {
      return columns.slice(1).map((col) => row[col.key] || '');
    });

    const newCsvContent = generateCsv(updatedData);
    saveContent(newCsvContent, true);
  };

  return (
    <div className="flex flex-col w-full">
      {isSupplierMode && (
        <div className="px-4 py-2 mb-2 text-sm bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="font-medium">Supplier instructions:</p>
          <p>Empty answer fields are highlighted in red. Please review and provide feedback on the specification.</p>
        </div>
      )}
    <DataGrid
      className={theme === 'dark' ? 'rdg-dark' : 'rdg-light'}
      columns={columns}
      rows={localRows}
      enableVirtualization
      onRowsChange={handleRowsChange}
      onCellClick={(args) => {
        if (args.column.key !== 'rowNumber') {
          args.selectCell(true);
        }
      }}
      style={{ height: '100%' }}
      defaultColumnOptions={{
        resizable: true,
        sortable: true,
      }}
    />
    </div>
  );
};

function areEqual(prevProps: SheetEditorProps, nextProps: SheetEditorProps) {
  return (
    prevProps.currentVersionIndex === nextProps.currentVersionIndex &&
    prevProps.isCurrentVersion === nextProps.isCurrentVersion &&
    !(prevProps.status === 'streaming' && nextProps.status === 'streaming') &&
    prevProps.content === nextProps.content &&
    prevProps.saveContent === nextProps.saveContent
  );
}

export const SpreadsheetEditor = memo(PureSpreadsheetEditor, areEqual);
