import { useState } from 'react';
import { PdfTools } from './pages/PdfTools';
import { ImageTools } from './pages/ImageTools';
import { OfficeTools } from './pages/OfficeTools';

type Tab = 'pdf' | 'image' | 'office';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('pdf');

  return (
    <div>
      <nav
        style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          padding: '1rem',
          borderBottom: '1px solid #eee',
        }}
      >
        <button
          data-testid="nav-pdf"
          onClick={() => setActiveTab('pdf')}
          style={{ fontWeight: activeTab === 'pdf' ? 'bold' : 'normal' }}
        >
          PDF
        </button>
        <button
          data-testid="nav-image"
          onClick={() => setActiveTab('image')}
          style={{ fontWeight: activeTab === 'image' ? 'bold' : 'normal' }}
        >
          Immagini
        </button>
        <button
          data-testid="nav-office"
          onClick={() => setActiveTab('office')}
          style={{ fontWeight: activeTab === 'office' ? 'bold' : 'normal' }}
        >
          Office
        </button>
      </nav>

      {activeTab === 'pdf' && <PdfTools />}
      {activeTab === 'image' && <ImageTools />}
      {activeTab === 'office' && <OfficeTools />}
    </div>
  );
}

export default App;