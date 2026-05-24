import React, { useState } from 'react';
import UploadScreen from './components/UploadScreen';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [data, setData] = useState(null);

  return data
    ? <Dashboard data={data} onReset={() => setData(null)} />
    : <UploadScreen onDataLoaded={setData} />;
}
