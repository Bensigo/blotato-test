// Import Cypress commands
import './commands'

// Disable uncaught exception handling for tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent Cypress from failing the test
  return false
})

// Global before hook
beforeEach(() => {
  // Clear localStorage before each test
  cy.clearLocalStorage()
  
  // Set up common test data
  cy.window().then((win) => {
    win.localStorage.setItem('test-mode', 'true')
  })
}) 