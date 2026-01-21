import React, { useState, useCallback, useRef } from 'react';
import { FileUploader } from './components/FileUploader';
import { parseExcelHeaders, generateExcelFile } from './services/excelService';
import { extractDataFromImage, identifyColumnsFromImage } from './services/geminiService';
import { ExcelColumn, ExtractedData, AppStep } from './types';

// Icons
const ExcelIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

const PdfIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-red-500">
    <path fillRule="evenodd" d="M5.625 1.5H9a.375.375 0 0 1 .375.375v1.875c0 1.036.84 1.875 1.875 1.875H12.975c.207 0 .375.168.375.375v16.5c0 1.035-.84 1.875-1.875 1.875H6a.375.375 0 0 1-.375-.375V1.5Zm5.5 1.5v2h3a.75.75 0 0 0-.75-.75h-2.25Zm1.125 7.5a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5h-1.5ZM9 12.75a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5H9Zm0 3a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5H9Z" clipRule="evenodd" />
  </svg>
);

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD_TEMPLATE);
  const [columns, setColumns] = useState<ExcelColumn[]>([]);
  const [items, setItems] = useState<ExtractedData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [templateName, setTemplateName] = useState<string>('');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  
  // State for Step 1 (Define Columns)
  const [sampleImage, setSampleImage] = useState<string | null>(null);
  const [isAnalyzingSample, setIsAnalyzingSample] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  // Step 0: Handle Excel Template Upload
  const handleTemplateUpload = async (files: File[]) => {
    const file = files[0];
    if (file) {
      try {
        const cols = await parseExcelHeaders(file);
        setColumns(cols);
        setTemplateName(file.name);
        setTemplateFile(file); // Store the file for later appending
        // Change: Go to DEFINE_COLUMNS instead of UPLOAD_IMAGES so user can verify headers
        setStep(AppStep.DEFINE_COLUMNS);
      } catch (error) {
        alert("Failed to parse Excel file. Please ensure it is a valid .xlsx file.");
        console.error(error);
      }
    }
  };

  const handleStartWithoutTemplate = () => {
    setTemplateName('Auto-generated Schema');
    setTemplateFile(null);
    setStep(AppStep.DEFINE_COLUMNS);
  };

  // Step 1: Upload Sample for Analysis
  const handleSampleUpload = async (files: File[]) => {
    const file = files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setSampleImage(base64);
        setIsAnalyzingSample(true);
        
        try {
          const detectedHeaders = await identifyColumnsFromImage(base64);
          const cols: ExcelColumn[] = detectedHeaders.map(h => ({
            header: h,
            key: h.toLowerCase().replace(/\s/g, '_')
          }));
          setColumns(cols);
          
          setItems([{
            id: Math.random().toString(36).substr(2, 9),
            originalImage: base64,
            data: [],
            status: 'pending'
          }]);
        } catch (err) {
          console.error(err);
        } finally {
          setIsAnalyzingSample(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addColumn = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newColumnName.trim()) {
      setColumns([...columns, { 
        header: newColumnName.trim(), 
        key: newColumnName.trim().toLowerCase().replace(/\s/g, '_') 
      }]);
      setNewColumnName('');
    }
  };

  const updateColumnName = (index: number, newName: string) => {
    const newColumns = [...columns];
    newColumns[index] = {
      ...newColumns[index],
      header: newName,
      key: newName.toLowerCase().replace(/\s/g, '_')
    };
    setColumns(newColumns);
  };

  const removeColumn = (index: number) => {
    const newColumns = [...columns];
    newColumns.splice(index, 1);
    setColumns(newColumns);
  };

  const confirmColumns = () => {
    if (columns.length === 0) {
      alert("Please define at least one column.");
      return;
    }
    setStep(AppStep.UPLOAD_IMAGES);
  };

  // Step 2: Handle Image Uploads (Batch)
  const handleImageUpload = (files: File[]) => {
    const newItems: ExtractedData[] = [];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          originalImage: e.target?.result as string,
          data: [],
          status: 'pending'
        });
        
        // When all read, update state
        if (newItems.length === files.length) {
          setItems(prev => [...prev, ...newItems]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Trigger processing for pending items
  const processImages = useCallback(async () => {
    setIsProcessing(true);
    const pendingItems = items.filter(i => i.status === 'pending');
    let updatedItems = [...items];

    for (const item of pendingItems) {
      updatedItems = updatedItems.map(i => i.id === item.id ? { ...i, status: 'processing' } : i);
      setItems(updatedItems);

      try {
        // Now returns Array of objects
        const dataRows = await extractDataFromImage(item.originalImage, columns);
        
        updatedItems = updatedItems.map(i => 
          i.id === item.id 
            ? { ...i, status: 'completed', data: dataRows } 
            : i
        );
      } catch (error) {
        console.error(error);
        updatedItems = updatedItems.map(i => i.id === item.id ? { ...i, status: 'error' } : i);
      }
      setItems(updatedItems);
    }
    
    setIsProcessing(false);
    setStep(AppStep.REVIEW_DATA);
  }, [items, columns]);

  // Update a specific cell value (handling multiple rows per item)
  const handleCellChange = (itemId: string, rowIndex: number, key: string, value: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newData = [...item.data];
        newData[rowIndex] = {
          ...newData[rowIndex],
          [key]: value
        };
        return { ...item, data: newData };
      }
      return item;
    }));
  };

  // Export to Excel
  const handleExport = async () => {
    // Flatten all items and their rows into a single list
    const exportRows = items.flatMap(item => item.data);
    
    // Pass the original template file if it exists
    await generateExcelFile(columns, exportRows, templateFile || undefined);
    setStep(AppStep.EXPORT);
  };

  const reset = () => {
    setStep(AppStep.UPLOAD_TEMPLATE);
    setColumns([]);
    setItems([]);
    setTemplateName('');
    setTemplateFile(null);
    setSampleImage(null);
  };

  // Helper to detect if file is PDF
  const isPdf = (base64: string) => base64.startsWith('data:application/pdf');

  // Render Helpers
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8 overflow-x-auto py-2">
      {[
        { step: AppStep.UPLOAD_TEMPLATE, label: 'Start' },
        { step: AppStep.DEFINE_COLUMNS, label: 'Fields' },
        { step: AppStep.UPLOAD_IMAGES, label: 'Upload' },
        { step: AppStep.REVIEW_DATA, label: 'Review' },
        { step: AppStep.EXPORT, label: 'Done' }
      ].map((s, idx) => (
        <div key={idx} className={`flex items-center whitespace-nowrap ${s.step === AppStep.DEFINE_COLUMNS && templateName !== 'Auto-generated Schema' && step !== AppStep.DEFINE_COLUMNS ? 'hidden' : ''}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step >= s.step ? 'bg-excel-600 text-white' : 'bg-slate-200 text-slate-500'
          }`}>
            {idx + 1}
          </div>
          <span className={`ml-2 text-sm hidden sm:block ${step >= s.step ? 'text-excel-900 font-medium' : 'text-slate-400'}`}>
            {s.label}
          </span>
          {idx < 4 && <div className="w-8 h-0.5 bg-slate-200 mx-2 hidden sm:block" />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-excel-600 rounded-lg flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.035-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.035.84-1.875 1.875-1.875h.75c1.035 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.035.84-1.875 1.875-1.875h.75c1.035 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
                </svg>
              </div>
              <span className="font-bold text-xl text-slate-800">Excel Vision AI</span>
            </div>
            
            <div className="hidden md:flex items-center px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-md text-xs font-medium text-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 mr-1">
                <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.75 3.75 0 0 0 2.576-2.576l.813-2.846A.75.75 0 0 1 9 4.5ZM19.75 11.625a.375.375 0 0 0-.375.375v2.875c0 .621.504 1.125 1.125 1.125h.375a3.75 3.75 0 0 1 3.75 3.75v1.875a.375.375 0 0 0 .75 0v-1.875a4.5 4.5 0 0 0-4.5-4.5h-.375v-2.875a.375.375 0 0 0-.375-.375Z" clipRule="evenodd" />
              </svg>
              Powered by Gemini 3 Flash
            </div>
          </div>
          {templateName && (
             <div className="text-sm px-3 py-1 bg-slate-100 rounded-full text-slate-600 border border-slate-200 max-w-[200px] truncate">
               {templateName}
             </div>
          )}
        </div>
      </header>

      <main className="flex-grow p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {renderStepIndicator()}

          {/* STEP 0: Upload Template */}
          {step === AppStep.UPLOAD_TEMPLATE && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">Upload Excel Template</h1>
                <p className="text-slate-500 text-lg">
                  Start by uploading the Excel file you want to fill. We'll use its headers to structure the data extracted from your images.
                </p>
              </div>
              
              <FileUploader 
                onUpload={handleTemplateUpload} 
                accept=".xlsx,.xls" 
                title="Drop your Excel file here" 
                subtitle="Supports .xlsx and .xls"
                icon={<ExcelIcon />}
              />

              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">OR</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button 
                onClick={handleStartWithoutTemplate}
                className="w-full bg-white border-2 border-slate-200 text-slate-600 hover:border-excel-500 hover:text-excel-600 hover:bg-excel-50 p-4 rounded-xl transition-all font-semibold flex items-center justify-center space-x-2 group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 group-hover:scale-110 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
                <span>Start without Template (Auto-detect Fields)</span>
              </button>
            </div>
          )}

          {/* STEP 1: Define Columns (New Step) */}
          {step === AppStep.DEFINE_COLUMNS && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Identify Data Fields</h1>
                <p className="text-slate-500">
                  {templateFile 
                    ? "We found these columns in your Excel file. Verify them before proceeding." 
                    : "Upload a sample image to detect fields, or add them manually."}
                </p>
              </div>

              <div className={`grid grid-cols-1 ${sampleImage ? 'md:grid-cols-2' : ''} gap-8`}>
                 {/* Left: Image/PDF Preview */}
                 <div className={`border border-slate-200 rounded-xl p-4 bg-white h-fit sticky top-20 ${!sampleImage ? 'hidden' : 'block'}`}>
                    <h3 className="font-semibold text-slate-700 mb-2">Sample Document</h3>
                    {sampleImage && (
                       isPdf(sampleImage) ? (
                         <div className="w-full aspect-[3/4] bg-slate-100 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200">
                            <PdfIcon />
                            <span className="text-sm text-slate-500 mt-2">PDF Document</span>
                         </div>
                       ) : (
                         <img src={sampleImage} alt="sample" className="w-full h-auto rounded-lg shadow-sm" />
                       )
                    )}
                 </div>

                 {/* Right: Field Editor */}
                 <div className={`border border-slate-200 rounded-xl p-6 bg-white flex flex-col ${!sampleImage ? 'w-full md:w-2/3 mx-auto' : ''}`}>
                    <div className="mb-4 flex justify-between items-center">
                      <div>
                         <h3 className="font-semibold text-slate-700 text-lg">Target Columns</h3>
                         <p className="text-xs text-slate-400">Edit field names to match your needs.</p>
                      </div>
                      {!sampleImage && !templateFile && (
                          <button 
                            onClick={() => document.getElementById('sample-upload')?.click()}
                            className="text-sm text-excel-600 hover:text-excel-700 font-medium"
                          >
                             + Auto-detect from Image/PDF
                          </button>
                      )}
                      {/* Hidden input for sample upload trigger */}
                      <input 
                         type="file" 
                         id="sample-upload" 
                         className="hidden" 
                         accept="image/*,application/pdf"
                         onChange={(e) => e.target.files && handleSampleUpload([e.target.files[0]])}
                      />
                    </div>

                    {isAnalyzingSample ? (
                      <div className="flex-grow flex flex-col items-center justify-center py-12 text-slate-500">
                         <svg className="animate-spin h-8 w-8 text-excel-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <p>Analyzing document structure...</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex-grow overflow-y-auto mb-4 space-y-2 max-h-[400px] custom-scrollbar">
                             {columns.map((col, idx) => (
                               <div key={idx} className="flex items-center space-x-2 group">
                                 <input 
                                   type="text" 
                                   value={col.header}
                                   onChange={(e) => updateColumnName(idx, e.target.value)}
                                   className="flex-grow border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-excel-500 focus:ring-1 focus:ring-excel-500 focus:bg-white transition-all"
                                 />
                                 <button 
                                   onClick={() => removeColumn(idx)} 
                                   className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                   title="Remove field"
                                 >
                                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                     <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                   </svg>
                                 </button>
                               </div>
                             ))}
                             
                           {columns.length === 0 && (
                             <p className="text-sm text-slate-400 italic py-4 text-center">No fields detected. Add some manually or upload a sample.</p>
                           )}
                        </div>

                        <form onSubmit={addColumn} className="flex gap-2 mb-6 pt-4 border-t border-slate-100">
                           <input 
                              type="text" 
                              value={newColumnName}
                              onChange={(e) => setNewColumnName(e.target.value)}
                              placeholder="Add new field (e.g. Tax)"
                              className="flex-grow border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-excel-500 focus:ring-1 focus:ring-excel-500"
                           />
                           <button type="submit" className="bg-slate-100 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-200">
                             Add
                           </button>
                        </form>

                        <div className="flex gap-3">
                           {sampleImage ? (
                             <button 
                               onClick={() => setSampleImage(null)}
                               className="flex-1 bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                             >
                               Close Sample
                             </button>
                           ) : templateFile && (
                              <button 
                                onClick={() => document.getElementById('sample-upload')?.click()}
                                className="flex-1 bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                              >
                                Test with Image
                              </button>
                           )}
                           <button 
                             onClick={confirmColumns}
                             className="flex-1 bg-excel-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-excel-700 transition-colors shadow-sm"
                           >
                             Confirm & Next
                           </button>
                        </div>
                      </>
                    )}
                  </div>
              </div>
            </div>
          )}

          {/* STEP 2: Upload Images */}
          {step === AppStep.UPLOAD_IMAGES && (
            <div className="max-w-4xl mx-auto space-y-6">
               <div className="flex justify-between items-end mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Upload Data Sources</h2>
                    <p className="text-slate-500">
                       Upload images or PDFs. We will extract multiple rows per document if tables are detected.
                    </p>
                  </div>
                  {items.length > 0 && (
                    <button 
                      onClick={processImages}
                      disabled={isProcessing}
                      className="bg-excel-600 hover:bg-excel-700 text-white px-6 py-2.5 rounded-lg shadow-sm font-medium transition-all flex items-center"
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing {items.filter(i => i.status === 'pending').length} items...
                        </>
                      ) : (
                        <>Analyze with Gemini Flash <span className="ml-2">→</span></>
                      )}
                    </button>
                  )}
               </div>

               <FileUploader 
                  onUpload={handleImageUpload} 
                  accept="image/*,application/pdf" 
                  multiple={true}
                  title="Drop images or PDFs here" 
                  subtitle="Supports JPG, PNG, WEBP, PDF (Blurry images accepted)"
                  icon={<ImageIcon />}
                />

                {items.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-8">
                    {items.map((item) => (
                      <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm">
                        {isPdf(item.originalImage) ? (
                           <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-4">
                              <PdfIcon />
                              <span className="text-xs font-medium text-slate-500 mt-2 text-center truncate w-full">Document</span>
                           </div>
                        ) : (
                           <img src={item.originalImage} alt="upload" className="w-full h-full object-cover" />
                        )}
                        
                        {/* Status Overlay */}
                        {item.status === 'pending' && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-medium">Ready</span>
                          </div>
                        )}
                        {item.status === 'processing' && (
                           <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-excel-500 border-t-transparent rounded-full animate-spin"></div>
                           </div>
                        )}
                        {item.status === 'completed' && (
                           <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                              </svg>
                           </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* STEP 3: Review Data */}
          {step === AppStep.REVIEW_DATA && (
             <div className="flex flex-col h-[calc(100vh-14rem)]">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Review & Edit</h2>
                    <p className="text-slate-500">
                       {templateName 
                         ? <span>AI output based on your images. These will be appended to <span className="font-semibold text-slate-900">{templateName}</span>.</span>
                         : "AI output based on your images. Please verify accuracy."}
                    </p>
                  </div>
                  <button 
                    onClick={handleExport}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg shadow-lg shadow-slate-900/10 font-medium transition-all flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    {templateName ? "Append & Export" : "Export to Excel"}
                  </button>
                </div>

                <div className="flex-grow overflow-auto border border-slate-200 rounded-xl shadow-sm bg-white custom-scrollbar">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">
                          Source
                        </th>
                        {columns.length === 0 ? (
                           <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                             No Data Detected
                           </th>
                        ) : columns.map(col => (
                          <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[150px]">
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {items.map((item) => (
                        <React.Fragment key={item.id}>
                          {item.data.length > 0 ? (
                            item.data.map((row, rowIndex) => (
                              <tr key={`${item.id}-${rowIndex}`} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {/* Only show image on first row of the item */}
                                  {rowIndex === 0 && (
                                     <div className="relative group cursor-pointer w-12 h-12">
                                        {isPdf(item.originalImage) ? (
                                           <div className="w-12 h-12 bg-slate-100 rounded border border-slate-200 flex items-center justify-center">
                                              <span className="text-[10px] font-bold text-red-500">PDF</span>
                                           </div>
                                        ) : (
                                          <>
                                            <img 
                                              src={item.originalImage} 
                                              className="w-12 h-12 object-cover rounded border border-slate-200"
                                              alt="source"
                                            />
                                            <div className="hidden group-hover:block absolute left-14 top-0 z-50 w-64 p-1 bg-white border border-slate-200 shadow-xl rounded-lg">
                                              <img src={item.originalImage} className="w-full h-auto rounded" alt="preview" />
                                            </div>
                                          </>
                                        )}
                                     </div>
                                  )}
                                </td>
                                {columns.map(col => (
                                  <td key={col.key} className="px-2 py-2 whitespace-nowrap">
                                    <input
                                      type="text"
                                      className="w-full px-3 py-1.5 text-sm border-transparent focus:border-excel-500 focus:ring-1 focus:ring-excel-500 rounded bg-transparent hover:bg-slate-100 focus:bg-white transition-all"
                                      value={row[col.header] || ''}
                                      onChange={(e) => handleCellChange(item.id, rowIndex, col.header, e.target.value)}
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))
                          ) : (
                            // Empty state if processing failed or no data
                            <tr className="hover:bg-slate-50">
                               <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="w-12 h-12 object-cover rounded border border-slate-200 bg-slate-100 flex items-center justify-center">
                                     <span className="text-xs text-slate-400">?</span>
                                  </div>
                               </td>
                               <td colSpan={columns.length} className="px-6 py-4 text-sm text-slate-400 italic">
                                  No data extracted from this image.
                               </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          )}

          {/* STEP 4: Export Success */}
          {step === AppStep.EXPORT && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Export Complete!</h2>
              <p className="text-slate-500 mb-8">
                 {templateFile ? <span>Successfully appended data to <strong>{templateFile.name}</strong></span> : "Your data has been exported to a new Excel file."}
              </p>
              
              <button 
                onClick={reset}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-2.5 rounded-lg shadow-sm font-medium transition-all"
              >
                Process More Files
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;