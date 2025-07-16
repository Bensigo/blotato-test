// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      mockOpenAI(response?: { isAllowed: boolean; flaggedCategories: string[]; confidenceScore?: number }): Chainable<void>
      mockTwitterAPI(response?: { success: boolean; twitterId?: string; error?: string }): Chainable<void>
    }
  }
}

// Command to mock OpenAI API with enhanced response support
Cypress.Commands.add('mockOpenAI', (response = { isAllowed: true, flaggedCategories: [], confidenceScore: 0.01 }) => {
  cy.intercept('POST', '/api/moderate', {
    statusCode: 200,
    body: {
      success: true,
      data: {
        isAllowed: response.isAllowed,
        flaggedCategories: response.flaggedCategories,
        confidenceScore: response.confidenceScore || (response.isAllowed ? 0.01 : 0.75),
        moderationResult: {
          id: 'modr-cypress-test',
          model: 'omni-moderation-latest',
          results: [{
            flagged: !response.isAllowed,
            categories: {
              hate: response.flaggedCategories.includes('hate'),
              'hate/threatening': response.flaggedCategories.includes('hate/threatening'),
              harassment: response.flaggedCategories.includes('harassment'),
              'harassment/threatening': response.flaggedCategories.includes('harassment/threatening'),
              'self-harm': response.flaggedCategories.includes('self-harm'),
              'self-harm/intent': response.flaggedCategories.includes('self-harm/intent'),
              'self-harm/instructions': response.flaggedCategories.includes('self-harm/instructions'),
              sexual: response.flaggedCategories.includes('sexual'),
              'sexual/minors': response.flaggedCategories.includes('sexual/minors'),
              violence: response.flaggedCategories.includes('violence'),
              'violence/graphic': response.flaggedCategories.includes('violence/graphic'),
            },
            category_scores: {
              hate: response.flaggedCategories.includes('hate') ? (response.confidenceScore || 0.75) : 0.001,
              'hate/threatening': response.flaggedCategories.includes('hate/threatening') ? (response.confidenceScore || 0.75) : 0.001,
              harassment: response.flaggedCategories.includes('harassment') ? (response.confidenceScore || 0.75) : 0.001,
              'harassment/threatening': response.flaggedCategories.includes('harassment/threatening') ? (response.confidenceScore || 0.75) : 0.001,
              'self-harm': response.flaggedCategories.includes('self-harm') ? (response.confidenceScore || 0.75) : 0.001,
              'self-harm/intent': response.flaggedCategories.includes('self-harm/intent') ? (response.confidenceScore || 0.75) : 0.001,
              'self-harm/instructions': response.flaggedCategories.includes('self-harm/instructions') ? (response.confidenceScore || 0.75) : 0.001,
              sexual: response.flaggedCategories.includes('sexual') ? (response.confidenceScore || 0.75) : 0.001,
              'sexual/minors': response.flaggedCategories.includes('sexual/minors') ? (response.confidenceScore || 0.75) : 0.001,
              violence: response.flaggedCategories.includes('violence') ? (response.confidenceScore || 0.75) : 0.001,
              'violence/graphic': response.flaggedCategories.includes('violence/graphic') ? (response.confidenceScore || 0.75) : 0.001,
            },
          }],
        },
      },
    },
  }).as('moderateContent')
})

// Command to mock Twitter API
Cypress.Commands.add('mockTwitterAPI', (response = { success: true, twitterId: 'tweet_123' }) => {
  if (response.success) {
    cy.intercept('POST', '/api/twitter/publish', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: response.twitterId,
          text: 'Published successfully',
          created_at: new Date().toISOString(),
        },
      },
    }).as('publishToTwitter')
  } else {
    cy.intercept('POST', '/api/twitter/publish', {
      statusCode: 400,
      body: {
        success: false,
        error: response.error || 'Twitter API error',
      },
    }).as('publishToTwitter')
  }
})

// Prevent TypeScript errors
export {} 