import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, ChevronRight, AlertCircle } from 'lucide-react';
import { uploadStatement, loadDemoData } from '../utils/api';
import { formatFileSize } from '../utils/format';

export default function UploadScreen({ onDataLoaded }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState('');
  const inputRef = useRef(null);

  const LOADING_MESSAGES = [
    '📄 Reading your bank statement...',
    '🔍 Extracting transactions...',
    '🏷️ Categorizing spending...',
    '📊 Building your dashboard...',
  ];

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError('Please upload a PDF bank statement.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB.');
      return;
    }
    setFile(f);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setProgress(0);

    let msgIdx = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIdx]);
    }, 1200);

    try {
      const result = await uploadStatement(file, {}, (p) => setProgress(p));
      clearInterval(msgInterval);
      onDataLoaded(result.data);
    } catch (err) {
      clearInterval(msgInterval);
      setError(err.response?.data?.error || err.message || 'Failed to parse the PDF. Try demo mode instead.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    setError(null);
    setLoadingMsg('✨ Loading demo statement...');
    try {
      const result = await loadDemoData();
      onDataLoaded(result.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load demo. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4 shadow-lg">
          <span className="text-3xl">💰</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">SpendWise</h1>
        <p className="text-gray-500 text-sm font-medium">AI-Powered Bank Statement Analyzer</p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md">
        <div className="card p-6 animate-slide-up">
          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
              ${dragActive ? 'border-primary-500 bg-primary-50 scale-[1.02]' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}
              ${file ? 'border-green-400 bg-green-50' : ''}
              ${loading ? 'pointer-events-none opacity-60' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />

            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-12 h-12 text-green-500" />
                <p className="font-semibold text-green-700">{file.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-xs text-red-400 hover:text-red-600 mt-1 underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-12 h-12 text-primary-400" />
                <div>
                  <p className="font-semibold text-gray-700">Drop your bank statement here</p>
                  <p className="text-sm text-gray-400 mt-1">or click to browse · PDF only · max 10MB</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-1">
                  {['HDFC', 'SBI', 'ICICI', 'Axis', 'Kotak'].map(b => (
                    <span key={b} className="badge bg-indigo-50 text-indigo-600">{b}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Loading Progress */}
          {loading && (
            <div className="mt-4 animate-fade-in">
              <p className="text-sm text-center text-primary-600 font-medium mb-2">{loadingMsg}</p>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300 bar-fill"
                  style={{ width: `${progress || 60}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex flex-col gap-3">
            <button
              className="btn-primary justify-center w-full"
              onClick={handleAnalyze}
              disabled={!file || loading}
            >
              {loading && !file ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <><Upload className="w-4 h-4" /> Analyze Statement</>
              )}
            </button>

            <button
              onClick={handleDemo}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-dashed border-indigo-200 text-primary-600 font-semibold hover:bg-indigo-50 transition-all duration-200 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              Try with Demo Statement
              <ChevronRight className="w-4 h-4 ml-auto" />
            </button>
          </div>
        </div>

        {/* Info Strip */}
        <p className="text-center text-xs text-gray-400 mt-4">
          🔒 Your data is processed locally — never stored on our servers
        </p>
      </div>
    </div>
  );
}
