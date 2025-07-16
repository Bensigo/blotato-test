describe('Twitter Integration', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.mockOpenAI({ isAllowed: true, flaggedCategories: [] })
  })

  it('should publish to Twitter successfully when authenticated', () => {
    const postContent = 'Publishing this amazing post to Twitter! #test'

    // Mock successful posting
    cy.intercept('POST', '/api/twitter/post', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 'tweet_123',
          text: postContent,
          created_at: new Date().toISOString(),
        },
      },
    }).as('publishToTwitter')

    // Mock authenticated session
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        user: { id: '123', name: 'Test User', username: 'testuser' },
        authenticated: true,
      },
    })

    // Create and post
    cy.get('[data-testid="post-textarea"]').type(postContent)
    cy.get('[data-testid="save-post-button"]').click()
    
    cy.wait('@moderateContent')

    // Verify success
    cy.get('[data-testid="toast"]').should('contain', 'Tweet Posted Successfully')
  })

  it('should handle Twitter API errors', () => {
    const postContent = 'Test post for API error'

    // Mock API error
    cy.intercept('POST', '/api/twitter/post', {
      statusCode: 400,
      body: {
        success: false,
        error: 'Twitter API error occurred',
      },
    }).as('twitterError')

    // Mock authenticated session
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        user: { id: '123', name: 'Test User', username: 'testuser' },
        authenticated: true,
      },
    })

    cy.get('[data-testid="post-textarea"]').type(postContent)
    cy.get('[data-testid="save-post-button"]').click()
    
    cy.wait('@moderateContent')

    cy.get('[data-testid="toast"]').should('contain', 'Error Occurred')
  })

  it('should handle Twitter rate limiting', () => {
    const postContent = 'Test post for rate limit'

    // Mock rate limit error
    cy.intercept('POST', '/api/twitter/post', {
      statusCode: 429,
      body: { 
        success: false,
        error: 'Rate limit exceeded. Please try again later.' 
      }
    }).as('twitterRateLimit')

    // Mock authenticated session
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        user: { id: '123', name: 'Test User', username: 'testuser' },
        authenticated: true,
      },
    })

    cy.get('[data-testid="post-textarea"]').type(postContent)
    cy.get('[data-testid="save-post-button"]').click()
    
    cy.wait('@moderateContent')

    cy.get('[data-testid="toast"]').should('contain', 'Error Occurred')
  })

  it('should require authentication for posting', () => {
    const postContent = 'Test post without auth'
    
    // Mock unauthenticated session
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        user: null,
        authenticated: false,
      },
    })

    cy.get('[data-testid="post-textarea"]').type(postContent)
    
    // Button should be disabled when not authenticated
    cy.get('[data-testid="save-post-button"]').should('be.disabled')
    
    // Should see authentication warning
    cy.get('body').should('contain', 'Sign in with Twitter to enable posting')
  })

  it('should show Twitter authentication flow', () => {
    // Mock unauthenticated session initially
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        user: null,
        authenticated: false,
      },
    })

    // Should show sign in button
    cy.get('body').should('contain', 'Sign in with Twitter')
    
    // Mock authentication URL redirect
    cy.intercept('GET', '/api/auth/twitter', {
      statusCode: 302,
      headers: {
        location: 'https://twitter.com/i/oauth2/authorize?...',
      },
    }).as('twitterAuth')
  })
}) 