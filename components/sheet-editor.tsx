'use client';

import React, { memo, useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { parse, unparse } from 'papaparse';
import { cn } from '@/lib/utils';
import 'react-data-grid/lib/styles.css';
import { Button } from '@/components/ui/button';
import { EyeOff, Eye } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';



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
  const isDark = theme === 'dark';
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
    
    // Always ensure we have at least MIN_ROWS rows
    while (paddedData.length < MIN_ROWS) {
      paddedData.push(Array(MIN_COLS).fill(''));
    }
    
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
      // When showing all rows, ensure we're showing all rows including empty ones
      return localRows;
    }
    
    if (lockedQuestionIds.length > 0) {
      // When filtering, only show the locked question IDs
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
        const questionCell = row.cells[1];
        const answerCell = row.cells[2];
        return (!answerCell || answerCell.trim() === '') && questionCell.trim() !== '';
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
      
      <div className={cn(
        "overflow-auto w-full h-[calc(100%-50px)]",
        isDark ? "border-0" : "border-[0.5px] border-slate-200"
      )}>
        <table className="border-separate border-spacing-0 w-full table-fixed">
          <thead>
            <tr className={cn(
              "font-semibold h-[20px] sticky top-0 z-[3]",
              isDark ? "bg-[#1A1B1A] text-[#FAFAF9]" : "bg-[#F9F9F9]"
            )}>
              {tableHeaders.map((header, index) => {
                const isIDColumn = index === 0;
                return (
                  <th 
                    key={header.key}
                    className={cn(
                      'px-4 py-2 h-[20px] overflow-hidden text-ellipsis whitespace-nowrap relative box-border text-left font-semibold', 
                      isDark ? 'border-b-[0.5px] border-[#1A1B1A] bg-[#1A1B1A] text-[#FAFAF9]' : 'border-b-[0.5px] border-t-[0.5px] border-slate-200 bg-[#F9F9F9]',
                      isIDColumn ? cn(
                        'sticky left-0 z-[1] overflow-visible text-clip whitespace-normal border-r-[0.5px]',
                        isDark ? 'bg-[#1A1B1A] shadow-[2px_0_8px_-2px_rgba(0,0,0,0.15)]' : 'shadow-[2px_0_8px_-2px_rgba(0,0,0,0.05)]'
                      ) : '',
                      index > 1 ? isDark ? 'border-l-[0.5px] border-[#1A1B1A]' : 'border-l-[0.5px]' : ''
                    )}
                    style={{ width: header.width }}
                  >
                    {isIDColumn ? '' : header.name}
                </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
              <AnimatePresence mode="sync" initial={false}>
                {displayedRows.map((row, rowIdx) => {
                  return (
                    <motion.tr
                      key={row.id}
                      className={cn('bg-white dark:bg-zinc-900')}
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
                      className={cn(
                        "px-4 py-2 h-[20px] sticky left-0 z-[1] overflow-visible text-clip whitespace-normal",
                        isDark ? "border-b-[0.5px] border-r-[0.5px] border-[#1A1B1A] bg-[#0A0A0A] text-[#FAFAF9] shadow-[2px_0_8px_-2px_rgba(0,0,0,0.15)]" : 
                               "border-b-[0.5px] border-r-[0.5px] border-slate-200 bg-white shadow-[2px_0_8px_-2px_rgba(0,0,0,0.05)]"
                      )}
                      style={{ width: tableHeaders[0]?.width || '50px' }}
                    >
                      {row.rowNumber || ''}
                    </td>
                    
                    {/* Data Cells */}
                    {row.cells.map((cell, cellIndex) => {
                      // Highlight unanswered answer cells in red when in unanswered mode
                      const isAnswerCol = cellIndex === 2;
                      const isUnanswered = isAnswerCol && (!cell || cell.trim() === '');
                      
                      // Check if this is the first row or if the previous row is answered (not unanswered)
                      const rowIndex = displayedRows.findIndex(r => r.id === row.id);
                      const prevRow = rowIndex > 0 ? displayedRows[rowIndex - 1] : null;
                      const isPrevRowAnswered = prevRow ? (prevRow.cells[2] && prevRow.cells[2].trim() !== '') : true;
                      const isFirstRow = rowIndex === 0 || (hideEmptyAnswers && isPrevRowAnswered && isUnanswered);
                      return (
                        <motion.td
                          key={cellIndex}
                          className={cn(
                            "px-4 py-2 h-[20px] overflow-hidden text-ellipsis whitespace-nowrap relative box-border",
                            isDark ? "border-b-[0.5px] border-[#1A1B1A] text-[#FAFAF9]" : "border-b-[0.5px] border-slate-200",
                            cellIndex > 0 ? isDark ? "border-l-[0.5px] border-[#1A1B1A]" : "border-l-[0.5px]" : ""
                          )}
                          initial={false}
                          animate={{
                            backgroundColor: hideEmptyAnswers && isUnanswered 
                              ? isDark ? "rgba(64, 17, 17, 0.6)" : "rgba(254, 226, 226, 1)" 
                              : isDark ? "rgba(10, 10, 10, 1)" : "rgba(255, 255, 255, 1)",
                            borderColor: hideEmptyAnswers && isUnanswered 
                              ? isDark ? "rgba(127, 29, 29, 0.6)" : "rgba(239, 68, 68, 1)" 
                              : isDark ? "rgba(26, 27, 26, 1)" : "rgba(226, 232, 240, 1)"
                          }}
                          transition={{ duration: 0.3 }}
                          style={{ 
                            width: cellIndex < tableHeaders.length - 1 ? tableHeaders[cellIndex + 1]?.width || 'auto' : '150px',
                            borderRight: hideEmptyAnswers && isUnanswered 
                              ? isDark ? '0.5px solid rgba(127, 29, 29, 0.6)' : '0.5px solid rgba(239, 68, 68, 1)' 
                              : undefined,
                            borderTop: hideEmptyAnswers && isUnanswered && isFirstRow 
                              ? isDark ? '0.5px solid rgba(127, 29, 29, 0.6)' : '0.5px solid rgba(239, 68, 68, 1)' 
                              : undefined
                          }}
                          onClick={() => setEditCell({ rowIndex: row.id, colIndex: cellIndex })}
                        >
                          <AnimatePresence mode="wait">
                            {editCell && editCell.rowIndex === row.id && editCell.colIndex === cellIndex ? (
                              <motion.div
                                key="input"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="size-full absolute inset-0"
                              >
                                <input
                                  type="text"
                                  className="size-full absolute inset-0 bg-transparent focus:outline-1 focus:ring-1 px-4 py-2 border-0"
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
                              </motion.div>
                            ) : (
                              <motion.div
                                key="text"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                              >
                                {cell}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.td>
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