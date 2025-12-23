
import React from 'react';

interface FileUploadProps {
  label: string;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  accept?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, onFileSelect, selectedFile, accept = ".pdf" }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col space-y-3 group">
      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">{label}</label>
      <div className={`relative border-2 border-dashed rounded-[2rem] p-8 transition-all duration-500 cursor-pointer overflow-hidden ${
        selectedFile 
        ? 'border-blue-500 bg-blue-50/30 ring-4 ring-blue-500/5' 
        : 'border-slate-200 bg-white/50 hover:border-blue-400 hover:bg-white/80 hover:shadow-xl hover:shadow-slate-200/50'
      }`}>
        <input 
          type="file" 
          onChange={handleChange} 
          accept={accept}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 transform ${
            selectedFile 
            ? 'bg-blue-600 text-white rotate-0 scale-110 shadow-lg shadow-blue-500/40' 
            : 'bg-slate-100 text-slate-400 group-hover:scale-110 group-hover:text-blue-500'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {selectedFile ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              )}
            </svg>
          </div>
          
          <div className="space-y-1">
            <p className={`text-sm font-black transition-colors ${selectedFile ? 'text-blue-700' : 'text-slate-700'}`}>
              {selectedFile ? selectedFile.name : 'Haz clic o arrastra aquí'}
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB Detectados` : 'Solo formato PDF'}
            </p>
          </div>
        </div>

        {selectedFile && (
          <div className="absolute top-0 right-0 p-4">
             <div className="flex h-3 w-3 relative">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
