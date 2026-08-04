describe('smoke test', () => {
  it('la pagina Vite di default si carica correttamente', () => {
    cy.visit('/');
    cy.get('body').should('be.visible');
  });
});