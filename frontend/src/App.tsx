import { useState } from 'react';
import { PdfTools } from './pages/PdfTools';
import { ImageTools } from './pages/ImageTools';

type Tab = 'pdf' | 'image';

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
      </nav>

      {activeTab === 'pdf' ? <PdfTools /> : <ImageTools />}
    </div>
  );
}

export default App;