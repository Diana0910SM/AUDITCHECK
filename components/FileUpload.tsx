
import React from 'react';

interface FileUploadProps {
  label: string;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  accept?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, onFileSelect, selectedFile, accept = ".pdf,.val" }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">{label}</label>
      <div className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${selectedFile ? 'border-[#0056b3] bg-blue-50/50' : 'border-slate-300 bg-white hover:border-blue-400'}`}>
        <input 
          type="file" 
          onChange={handleChange} 
          accept={accept}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full ${selectedFile ? 'bg-[#003b8e] text-white' : 'bg-slate-100 text-slate-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {selectedFile ? selectedFile.name : 'Seleccionar Archivo'}
            </p>
            <p className="text-xs text-slate-500 italic">
              {selectedFile ? `${(selectedFile.size / 1024).toFixed(2)} KB` : 'PDF o Archivo .VAL'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
