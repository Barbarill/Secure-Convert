import { useState } from 'react';
import { PdfTools } from './pages/PdfTools';
import { ImageTools } from './pages/ImageTools';
import { OfficeTools } from './pages/OfficeTools';

type Tab = 'pdf' | 'image' | 'office';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('pdf');

  return (
    <div>
      <nav className="nav-bar">
        <button
          data-testid="nav-pdf"
          className={`nav-tab ${activeTab === 'pdf' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('pdf')}
        >
          PDF
        </button>
        <button
          data-testid="nav-image"
          className={`nav-tab ${activeTab === 'image' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('image')}
        >
          Immagini
        </button>
        <button
          data-testid="nav-office"
          className={`nav-tab ${activeTab === 'office' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('office')}
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