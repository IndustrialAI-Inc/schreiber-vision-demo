'use client';

import React, { memo, useEffect, useMemo, useState, useRef } from 'react';
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

const MIN_ROWS = 50;
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
  
  // Animation state to control the fill-in effect
  const [animationStarted, setAnimationStarted] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  // Use this to ensure content starts empty when streaming begins
  const displayContent = !animationStarted && status === 'streaming' && isCurrentVersion ? '' : content;

  // Store the locked-in question IDs when filter is first activated
  const [lockedQuestionIds, setLockedQuestionIds] = useState<number[]>([]);

  const parseData = useMemo(() => {
    // Parse the CSV content with proper quote handling to prevent comma-splitting within fields
    // Use empty content when streaming to start with empty cells
    const result = parse<string[]>(displayContent, { 
      skipEmptyLines: false,
      quoteChar: '"', // Use double quotes for field encapsulation
      escapeChar: '"', // Escape quotes with another quote
    });
    
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
  }, [displayContent]);

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
  
  // Handle animation timing
  useEffect(() => {
    // When streaming starts, content is empty, and animation hasn't started
    if (status === 'streaming' && isCurrentVersion && !animationStarted) {
      // After a delay, start the animation to fill in cells
      const timer = setTimeout(() => {
        // First, update the display content by triggering animation
        setAnimationStarted(true);
        
        // Then allow the animation to run
        setTimeout(() => {
          setShouldAnimate(true);
        }, 100);
      }, 800); // Delay before the cells start filling in
      
      return () => clearTimeout(timer);
    } else if (status !== 'streaming') {
      // Reset animation state when not streaming
      setAnimationStarted(false);
      setShouldAnimate(false);
    }
  }, [status, isCurrentVersion, animationStarted]);
  


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
      // Create a proper deep copy to avoid mutation issues
      const updatedRows = localRows.map(row => ({
        ...row,
        cells: [...row.cells]
      }));
      
      if (!updatedRows[rowIndex] || !Array.isArray(updatedRows[rowIndex].cells)) {
        console.error('Invalid row data for editing');
        return;
      }
      
      // Update the cell value
      updatedRows[rowIndex].cells[colIndex] = newValue;
  
      // Update CSV content before setting state to avoid multiple renders
      const updatedData = updatedRows.map(row => Array.isArray(row.cells) ? row.cells : []);
      const newContent = unparse(updatedData);
      
      // First save content to parent
      saveContent(newContent, isCurrentVersion);
      
      // Then update local state
      setLocalRows(updatedRows);
    } catch (error) {
      console.error('Error handling cell edit:', error);
    }
  };
  
  // Use ref to track previous state of hideEmptyAnswers to avoid unnecessary updates
  const prevHideEmptyAnswersRef = useRef(hideEmptyAnswers);
  
  // Effect to set locked question IDs when filter is activated
  useEffect(() => {
    // Only run this effect if hideEmptyAnswers has actually changed
    if (prevHideEmptyAnswersRef.current !== hideEmptyAnswers) {
      if (hideEmptyAnswers) {
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
      } else {
      // When we turn off the filter, clear the locked IDs
      setLockedQuestionIds([]);
    }
      
      // Update ref to current value
      prevHideEmptyAnswersRef.current = hideEmptyAnswers;
    }
  }, [hideEmptyAnswers, localRows]);
  
  // Toggle empty answers visibility
  const toggleEmptyAnswers = () => {
    setHideEmptyAnswers(!hideEmptyAnswers);
  };


  return (
    <div className="flex flex-col size-full gap-2">
      <div className="p-2 mx-2 flex justify-between items-center border rounded-md">
        {!isDark && (
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
        )}
        <div className="text-sm ml-auto text-muted-foreground">
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
              {/* Performance optimization - completely disable animations for large datasets */}
              {displayedRows.length > 100 ? (
                // Regular table rows without animations for large datasets
                displayedRows.slice(0, 350).map((row) => (
                  <tr
                    key={row.id}
                    className={cn('bg-white dark:bg-zinc-900')}
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
                    
                    {/* Data Cells - limit to only the first 4 columns */}
                    {row.cells.slice(0, 4).map((cell, cellIndex) => {
                      // Highlight unanswered answer cells in red when in unanswered mode
                      const isAnswerCol = cellIndex === 2;
                      const isUnanswered = isAnswerCol && (!cell || cell.trim() === '');
                      
                      // Check if this is the first row or if the previous row is answered (not unanswered)
                      const rowIndex = displayedRows.findIndex(r => r.id === row.id);
                      const prevRow = rowIndex > 0 ? displayedRows[rowIndex - 1] : null;
                      const isPrevRowAnswered = prevRow ? (prevRow.cells[2] && prevRow.cells[2].trim() !== '') : true;
                      const isFirstRow = rowIndex === 0 || (hideEmptyAnswers && isPrevRowAnswered && isUnanswered);
                      
                      return (
                        <td
                          key={cellIndex}
                          className={cn(
                            "px-4 py-2 h-[20px] overflow-hidden text-ellipsis whitespace-nowrap relative box-border",
                            isDark ? "border-b-[0.5px] border-[#1A1B1A] text-[#FAFAF9]" : "border-b-[0.5px] border-slate-200",
                            cellIndex > 0 ? isDark ? "border-l-[0.5px] border-[#1A1B1A]" : "border-l-[0.5px]" : ""
                          )}
                          style={{ 
                            width: cellIndex < tableHeaders.length - 1 ? tableHeaders[cellIndex + 1]?.width || '100%' : '150px',
                            backgroundColor: hideEmptyAnswers && isUnanswered 
                              ? isDark ? "rgba(64, 17, 17, 0.6)" : "rgba(254, 226, 226, 1)" 
                              : isDark ? "rgba(10, 10, 10, 1)" : "rgba(255, 255, 255, 1)",
                            borderColor: hideEmptyAnswers && isUnanswered 
                              ? isDark ? "rgba(127, 29, 29, 0.6)" : "rgba(239, 68, 68, 1)" 
                              : isDark ? "rgba(26, 27, 26, 1)" : "rgba(226, 232, 240, 1)",
                            // Use individual border properties for unanswered cells
                            ...(hideEmptyAnswers && isUnanswered ? {
                              borderRightWidth: '0.5px',
                              borderRightStyle: 'solid',
                              borderRightColor: isDark ? 'rgba(127, 29, 29, 0.6)' : 'rgba(239, 68, 68, 1)',
                              ...(isFirstRow ? {
                                borderTopWidth: '0.5px',
                                borderTopStyle: 'solid',
                                borderTopColor: isDark ? 'rgba(127, 29, 29, 0.6)' : 'rgba(239, 68, 68, 1)',
                              } : {})
                            } : {})
                          }}
                          onClick={() => setEditCell({ rowIndex: row.id, colIndex: cellIndex })}
                        >
                          {editCell && editCell.rowIndex === row.id && editCell.colIndex === cellIndex ? (
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
                                if (editCell && editCell.rowIndex === row.id && editCell.colIndex === cellIndex &&
                                    localRows[row.id] && Array.isArray(localRows[row.id].cells)) {
                                  handleCellEdit(row.id, cellIndex, localRows[row.id].cells[cellIndex] || '');
                                  setEditCell(null);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && localRows[row.id] && Array.isArray(localRows[row.id].cells)) {
                                  handleCellEdit(row.id, cellIndex, localRows[row.id].cells[cellIndex] || '');
                                  setEditCell(null);
                                }
                              }}
                            />
                          ) : (
                            cell
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                // For small datasets, use animations but only for the first 100 rows
                <AnimatePresence mode="sync" initial={false}>
                  {displayedRows.slice(0, 100).map((row, rowIdx) => {
                    const shouldAnimate = rowIdx < 10;
                    return (
                      <motion.tr
                        key={row.id}
                        className={cn('bg-white dark:bg-zinc-900')}
                        layout={false}
                        initial={shouldAnimate ? { 
                          opacity: 0, 
                          y: -10 
                        } : false}
                        animate={shouldAnimate ? { 
                          opacity: 1,
                          y: 0,
                          transition: {
                            opacity: { duration: 0.2 },
                            y: { duration: 0.3, delay: rowIdx * 0.05 }
                          }
                        } : { opacity: 1 }}
                        exit={shouldAnimate ? { 
                          opacity: 0,
                          transition: { duration: 0.05 }
                        } : { opacity: 0 }}
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
                        
                        {/* Data Cells - limit to only the first 4 columns */}
                        {row.cells.slice(0, 4).map((cell, cellIndex) => {
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
                                width: cellIndex < tableHeaders.length - 1 ? tableHeaders[cellIndex + 1]?.width || '100%' : '150px',
                                // Use individual border properties to avoid React styling warnings
                                ...(hideEmptyAnswers && isUnanswered ? {
                                  borderRightWidth: '0.5px',
                                  borderRightStyle: 'solid',
                                  borderRightColor: isDark ? 'rgba(127, 29, 29, 0.6)' : 'rgba(239, 68, 68, 1)',
                                  ...(isFirstRow ? {
                                    borderTopWidth: '0.5px',
                                    borderTopStyle: 'solid',
                                    borderTopColor: isDark ? 'rgba(127, 29, 29, 0.6)' : 'rgba(239, 68, 68, 1)',
                                  } : {})
                                } : {})
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
                                        if (editCell && editCell.rowIndex === row.id && editCell.colIndex === cellIndex &&
                                            localRows[row.id] && Array.isArray(localRows[row.id].cells)) {
                                          const currentRowId = row.id;
                                          const currentCellIndex = cellIndex;
                                          const currentValue = localRows[row.id].cells[cellIndex] || '';
                                          // Set editCell to null before calling handleCellEdit to break potential circular updates
                                          setEditCell(null);
                                          handleCellEdit(currentRowId, currentCellIndex, currentValue);
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && localRows[row.id] && Array.isArray(localRows[row.id].cells)) {
                                          // Set editCell to null before calling handleCellEdit
                                          const value = localRows[row.id].cells[cellIndex] || '';
                                          setEditCell(null);
                                          handleCellEdit(row.id, cellIndex, value);
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
                                    transition={{ 
                                      duration: 0.3,
                                      delay: shouldAnimate ? Math.min(0.2 + (row.id * 0.03) + (cellIndex * 0.02), 2) : 0
                                    }}
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
              )}
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