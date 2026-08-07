describe('Compressione PDF client-side', () => {
  it('comprime un PDF e permette il download, senza alcuna richiesta di rete verso un server di conversione', () => {
    // Intercetta qualsiasi chiamata verso un ipotetico backend di conversione:
    // se durante il flusso partisse una richiesta, il test la registra e possiamo verificare che non sia avvenuta.
    cy.intercept('POST', '**/api/convert/**').as('serverConversion');

    cy.visit('/');

    cy.contains('Comprimi PDF').should('be.visible');
    cy.get('[data-testid="dropzone-input"]').selectFile('cypress/fixtures/test-document.pdf', {
      force: true,
    });

    cy.get('[data-testid="selected-files-summary"]').should('contain.text', 'test-document.pdf');

    cy.get('[data-testid="convert-button"]').click();

    // Attende il completamento della conversione (spinner sparisce, compare il link di download)
    cy.get('[data-testid="download-link"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="download-link"]').should('have.attr', 'download').and('include', '.pdf');

    // Verifica chiave: nessuna richiesta è mai partita verso un endpoint di conversione server
    cy.get('@serverConversion.all').should('have.length', 0);
  });

  it('mostra un errore gestito se il file caricato è un PDF corrotto', () => {
    cy.visit('/');

    // Creiamo al volo un file non valido con lo stesso nome/estensione, ma contenuto rotto
    cy.get('[data-testid="dropzone-input"]').selectFile(
      {
        contents: Cypress.Buffer.from('questo non è un pdf valido'),
        fileName: 'corrotto.pdf',
        mimeType: 'application/pdf',
      },
      { force: true }
    );

    cy.get('[data-testid="convert-button"]').click();

    cy.get('[data-testid="retry-button"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="progress-indicator"]').should('have.attr', 'data-status', 'error');
  });
});