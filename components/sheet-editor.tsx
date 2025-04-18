'use client';

import React, { memo, useEffect, useMemo, useState } from 'react';
import { parse, unparse } from 'papaparse';
import { cn } from '@/lib/utils';
import 'react-data-grid/lib/styles.css';
import { Button } from '@/components/ui/button';
import { EyeOff, Eye } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const GRID_STYLES = `
  .rdg {
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    overflow: auto;
    width: 100%;
    height: 100%;
  }
  
  .rdg table {
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
    table-layout: fixed;
  }

  .rdg-cell {
    padding: 0.5rem 1rem;
    height: 35px;
    border-bottom: 1px solid #e2e8f0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    position: relative;
    box-sizing: border-box;
  }

  .dark .rdg-cell {
    border-color: #374151;
  }

  .rdg-row-odd {
    background-color: rgba(243, 244, 246, 0.5);
  }

  .dark .rdg-row-odd {
    background-color: rgba(31, 41, 55, 0.3);
  }

  .rdg-row-even {
    background-color: white;
  }

  .dark .rdg-row-even {
    background-color: #111827;
  }

  .rdg-header-row {
    background-color: #f9fafb;
    font-weight: 600;
    height: 35px;
    position: sticky;
    top: 0;
    z-index: 3;
  }

  .dark .rdg-header-row {
    background-color: #1f2937;
  }

  .rdg-cell-frozen {
    position: sticky;
    left: 0;
    z-index: 1;
  }

  .rdg th {
    text-align: left;
    font-weight: 600;
  }
`;

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
  const [hideEmptyAnswers, setHideEmptyAnswers] = useState(false);
  const [editCell, setEditCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);

  // Store the locked-in question IDs when filter is first activated
  const [lockedQuestionIds, setLockedQuestionIds] = useState<number[]>([]);

  const parseData = useMemo(() => {
    // Parse the CSV content
    const result = parse<string[]>(content, { skipEmptyLines: false });
    
    // Check if first row is a header row (contains "ID", "Question", "Answer", "Source")
    let dataToProcess = result.data;
    if (dataToProcess.length > 0) {
      const firstRow = dataToProcess[0];
      const isHeaderRow = (
        firstRow.length >= 4 && 
        firstRow[0]?.trim().toLowerCase() === 'id' && 
        firstRow[1]?.trim().toLowerCase() === 'question' && 
        firstRow[2]?.trim().toLowerCase() === 'answer' && 
        firstRow[3]?.trim().toLowerCase() === 'source'
      );
      
      // Skip the header row if detected
      if (isHeaderRow) {
        dataToProcess = dataToProcess.slice(1);
      }
    }
    
    const paddedData = dataToProcess.map((row) => {
      const paddedRow = [...row];
      while (paddedRow.length < MIN_COLS) {
        paddedRow.push('');
      }
      return paddedRow;
    });
    
    return paddedData;
  }, [content]);

  // Define column headers for the custom table with fixed widths
  const tableHeaders = useMemo(() => {
    if (customColumns) {
      return customColumns.map(col => ({ key: col.key, name: col.name, width: col.width || 'auto' }));
    }
    
    return [
      { key: 'rowNumber', name: '#', width: '60px' },
      { key: '0', name: 'ID', width: '240px' },
      { key: '1', name: 'Question', width: '250px' },
      { key: '2', name: 'Answer', width: '250px' },
      { key: '3', name: 'Source', width: '150px' }
    ];
  }, [customColumns]);

  // Process the parsed data into a more manageable format
  const tableData = useMemo(() => {
    return parseData.map((row, rowIndex) => ({
      id: rowIndex,
      rowNumber: rowIndex + 1,
      cells: Array.isArray(row) ? row.map(cell => cell || '') : []
    }));
  }, [parseData]);

  // State for the table data that will be modified
  const [localRows, setLocalRows] = useState(tableData);

  useEffect(() => {
    setLocalRows(tableData);
  }, [tableData]);

  // Get the displayedRows based on filter state and locked question IDs
  const displayedRows = useMemo(() => {
    if (!hideEmptyAnswers) {
      return localRows;
    }
    
    if (lockedQuestionIds.length > 0) {
      return localRows.filter(row => lockedQuestionIds.includes(row.id));
    }
    
    return [];
  }, [localRows, hideEmptyAnswers, lockedQuestionIds]);
  
  const handleCellEdit = (rowIndex: number, colIndex: number, newValue: string) => {
    try {
      // Update local data
      const updatedRows = [...localRows];
      if (!updatedRows[rowIndex] || !Array.isArray(updatedRows[rowIndex].cells)) {
        console.error('Invalid row data for editing');
        return;
      }
      
      setLocalRows(updatedRows);
      setEditCell(null);
  
      // Update CSV content
      const updatedData = updatedRows.map(row => Array.isArray(row.cells) ? row.cells : []);
      const newContent = unparse(updatedData);
      
      // Save content
      saveContent(newContent, isCurrentVersion);
    } catch (error) {
      console.error('Error handling cell edit:', error);
      setEditCell(null);
    }
  };
  
  // Effect to set locked question IDs when filter is first activated
  useEffect(() => {
    if (hideEmptyAnswers && lockedQuestionIds.length === 0) {
      // Find unanswered questions
      const unansweredRows = localRows.filter(row => {
        const answerCell = row.cells[2];
        return !answerCell || answerCell.trim() === '';
      });
      
      // Take the first 5 unanswered questions' IDs
      const firstFiveIds = unansweredRows.slice(0, 5).map(row => row.id);
      
      // Lock these IDs in
      setLockedQuestionIds(firstFiveIds);
    } else if (!hideEmptyAnswers) {
      // When we turn off the filter, clear the locked IDs
      setLockedQuestionIds([]);
    }
  }, [hideEmptyAnswers, localRows, lockedQuestionIds.length]);
  
  // Toggle empty answers visibility
  const toggleEmptyAnswers = () => {
    setHideEmptyAnswers(!hideEmptyAnswers);
  };
  
  // Add the grid styles to the document
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = GRID_STYLES;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div className="flex flex-col size-full gap-2">
      <div className="p-2 mx-2 flex justify-between items-center border rounded-md">
        <Button 
          onClick={toggleEmptyAnswers}
          variant="outline"
          className="flex !border-0 items-center gap-1"
        >
          {hideEmptyAnswers ? (
            <>
              <Eye size={16} />
              <span>Show All Rows</span>
            </>
          ) : (
            <>
              <EyeOff size={16} />
              <span>Show Only Unanswered</span>
            </>
          )}
        </Button>
        <div className="text-sm text-muted-foreground">
          {displayedRows.length} rows {hideEmptyAnswers ? '(unanswered questions)' : '(all)'}
        </div>
      </div>
      
      <div className="rdg" style={{ height: 'calc(100% - 50px)' }}>
        <table>
          <thead>
            <tr className="rdg-header-row">
              {tableHeaders.map((header, index) => (
                <th 
                  key={header.key}
                  className={cn(
                    'rdg-cell', 
                    'border-t dark:bg-zinc-900 dark:text-zinc-50',
                    index === 0 ? 'border-r rdg-cell-frozen' : '',
                    index > 0 ? 'border-l' : ''
                  )}
                  style={{ width: header.width }}
                >
                  {header.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
              <AnimatePresence mode="sync" initial={false}>
                {displayedRows.map((row, rowIdx) => {
                  const isEven = rowIdx % 2 === 0;
                  
                  return (
                    <motion.tr
                      key={row.id}
                      className={`${isEven ? 'rdg-row-even' : 'rdg-row-odd'}`}
                      layout={false}
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: 1,
                        transition: {
                          duration: 0.15,
                          delay: rowIdx * 0.03
                        }
                      }}
                      exit={{ 
                        opacity: 0,
                        transition: { 
                          duration: 0.05
                        }
                      }}
                    >
                    {/* Row Number Cell */}
                    <td 
                      className="rdg-cell border-t border-r dark:bg-zinc-950 dark:text-zinc-50 rdg-cell-frozen"
                      style={{ width: tableHeaders[0]?.width || '50px' }}
                    >
                      {row.rowNumber || ''}
                    </td>
                    
                    {/* Data Cells */}
                    {row.cells.map((cell, cellIndex) => {
                      // Highlight unanswered answer cells in red when in unanswered mode
                      const isAnswerCol = cellIndex === 2;
                      const isUnanswered = isAnswerCol && (!cell || cell.trim() === '');
                      return (
                        <td
                          key={cellIndex}
                          className={cn(
                            "rdg-cell border-t dark:bg-zinc-950 dark:text-zinc-50 relative",
                            cellIndex > 0 ? "border-l" : "",
                            hideEmptyAnswers && isUnanswered ? "border-red-500 border-b border-r bg-red-50 dark:bg-red-950 dark:border-red-600" : ""
                          )}
                          style={{ width: cellIndex < tableHeaders.length - 1 ? tableHeaders[cellIndex + 1]?.width || 'auto' : '150px' }}
                          onClick={() => setEditCell({ rowIndex: row.id, colIndex: cellIndex })}
                        >
                          {editCell && editCell.rowIndex === row.id && editCell.colIndex === cellIndex ? (
                            <input
                              type="text"
                              className="size-full absolute inset-0 bg-transparent focus:outline-none focus:ring-0 px-4 py-2 border-0"
                              value={cell}
                              autoFocus
                              onChange={(e) => {
                                const updatedRows = [...localRows];
                                if (updatedRows[row.id] && Array.isArray(updatedRows[row.id].cells)) {
                                  updatedRows[row.id].cells[cellIndex] = e.target.value;
                                  setLocalRows(updatedRows);
                                }
                              }}
                              onBlur={() => {
                                if (localRows[row.id] && Array.isArray(localRows[row.id].cells)) {
                                  // Save the current row ID and cell index for reference
                                  const currentRowId = row.id;
                                  const currentCellIndex = cellIndex;
                                  const currentValue = localRows[row.id].cells[cellIndex] || '';
                                  handleCellEdit(currentRowId, currentCellIndex, currentValue);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && localRows[row.id] && Array.isArray(localRows[row.id].cells)) {
                                  handleCellEdit(row.id, cellIndex, localRows[row.id].cells[cellIndex] || '');
                                }
                              }}
                            />
                          ) : (
                            <>{cell}</>
                          )}
                        </td>
                      );
                    })}
                  </motion.tr>
                );
              })}
              </AnimatePresence>
          </tbody>
        </table>
      </div>
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
