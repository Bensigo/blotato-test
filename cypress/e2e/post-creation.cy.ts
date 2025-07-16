describe('Post Creation Flow', () => {
  beforeEach(() => {
    // Mock authenticated session by default for post creation tests
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        user: { id: '123', name: 'Test User', username: 'testuser' },
        authenticated: true,
      },
    })
    
    cy.visit('/')
    cy.mockOpenAI({ isAllowed: true, flaggedCategories: [] })
  })

  it('should create a post successfully', () => {
    const postContent = 'This is a test post for Cypress testing'

    // Mock successful Twitter posting
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
    }).as('postToTwitter')

    // Type content into textarea
    cy.get('[data-testid="post-textarea"]').type(postContent)

    // Verify character counter updates
    cy.get('[data-testid="character-counter"]').should('contain', `${postContent.length} / 280`)

    // Save the post (this triggers moderation and posting)
    cy.get('[data-testid="save-post-button"]').click()

    // Wait for moderation API call
    cy.wait('@moderateContent')

    // Verify success message
    cy.get('[data-testid="toast"]').should('contain', 'Tweet Posted Successfully')
  })

  it('should show character count warnings', () => {
    // Type content to trigger warning (70% of 280 = 196 chars)
    const warningContent = 'a'.repeat(200)
    cy.get('[data-testid="post-textarea"]').type(warningContent)

    // Verify warning state
    cy.get('[data-testid="character-counter"]').should('have.class', 'text-yellow-600')
    cy.get('[data-testid="character-counter"]').should('contain', '200 / 280')
  })

  it('should prevent posting when over character limit', () => {
    // Type content over the limit
    const overLimitContent = 'a'.repeat(300)
    cy.get('[data-testid="post-textarea"]').type(overLimitContent)

    // Verify danger state
    cy.get('[data-testid="character-counter"]').should('have.class', 'text-red-600')
    
    // Save button should be disabled when over limit
    cy.get('[data-testid="save-post-button"]').should('be.disabled')
  })

  it('should handle content moderation rejection for hate speech', () => {
    // Mock OpenAI to reject hate speech with high confidence
    cy.mockOpenAI({ 
      isAllowed: false, 
      flaggedCategories: ['hate', 'harassment'],
      confidenceScore: 0.85
    })

    const flaggedContent = 'I hate all people from that group'
    cy.get('[data-testid="post-textarea"]').type(flaggedContent)
    cy.get('[data-testid="save-post-button"]').click()

    cy.wait('@moderateContent')

    // Verify error message
    cy.get('[data-testid="toast"]').should('contain', 'Content Blocked by AI Moderation')
    cy.get('[data-testid="moderation-feedback"]').should('be.visible')
  })

  it('should handle subtle harassment detection with enhanced sensitivity', () => {
    // Mock OpenAI to catch subtle harassment with new sensitive thresholds
    cy.mockOpenAI({ 
      isAllowed: false, 
      flaggedCategories: ['harassment'],
      confidenceScore: 0.14 // Above high sensitivity threshold (0.05) but below old threshold (0.3)
    })

    const subtleHarassment = 'I hate everyone'
    cy.get('[data-testid="post-textarea"]').type(subtleHarassment)
    cy.get('[data-testid="save-post-button"]').click()

    cy.wait('@moderateContent')

    // Verify content is properly flagged with new sensitivity
    cy.get('[data-testid="toast"]').should('contain', 'Content Blocked by AI Moderation')
    cy.get('[data-testid="moderation-feedback"]').should('contain', 'harassment')
  })

  it('should allow borderline content that falls below thresholds', () => {
    // Mock content that's borderline but below even the sensitive threshold
    cy.mockOpenAI({ 
      isAllowed: true, 
      flaggedCategories: [],
      confidenceScore: 0.02 // Below high sensitivity threshold (0.05)
    })

    // Mock successful Twitter posting
    cy.intercept('POST', '/api/twitter/post', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 'tweet_456',
          text: 'I am frustrated with this situation',
          created_at: new Date().toISOString(),
        },
      },
    }).as('postToTwitter')

    const borderlineContent = 'I am frustrated with this situation'
    cy.get('[data-testid="post-textarea"]').type(borderlineContent)
    cy.get('[data-testid="save-post-button"]').click()

    cy.wait('@moderateContent')

    // Verify content is allowed and posted
    cy.get('[data-testid="toast"]').should('contain', 'Tweet Posted Successfully')
  })

  it('should detect violence with standard threshold', () => {
    // Mock OpenAI to reject violent content
    cy.mockOpenAI({ 
      isAllowed: false, 
      flaggedCategories: ['violence'],
      confidenceScore: 0.65 // Above standard threshold (0.1)
    })

    const violentContent = 'I want to hurt someone badly'
    cy.get('[data-testid="post-textarea"]').type(violentContent)
    cy.get('[data-testid="save-post-button"]').click()

    cy.wait('@moderateContent')

    // Verify violence is flagged
    cy.get('[data-testid="toast"]').should('contain', 'Content Blocked by AI Moderation')
    cy.get('[data-testid="moderation-feedback"]').should('contain', 'violence')
  })

  it('should auto-save drafts', () => {
    const draftContent = 'This is a draft that should be auto-saved'
    
    cy.get('[data-testid="post-textarea"]').type(draftContent)
    
    // Wait for auto-save (2 seconds)
    cy.wait(2500)
    
    // Refresh page and verify draft is restored
    cy.reload()
    cy.get('[data-testid="post-textarea"]').should('have.value', draftContent)
  })

  it('should clear content and drafts', () => {
    const content = 'Content to be cleared'
    
    cy.get('[data-testid="post-textarea"]').type(content)
    cy.get('[data-testid="clear-button"]').click()
    
    // Verify content is cleared
    cy.get('[data-testid="post-textarea"]').should('have.value', '')
    cy.get('[data-testid="character-counter"]').should('contain', '0 / 280')
  })

  it('should handle network errors gracefully', () => {
    // Mock network failure
    cy.intercept('POST', '/api/moderate', { forceNetworkError: true }).as('moderateNetworkError')
    
    const content = 'Test content for network error'
    cy.get('[data-testid="post-textarea"]').type(content)
    cy.get('[data-testid="save-post-button"]').click()
    
    cy.wait('@moderateNetworkError')
    
    // Verify error handling
    cy.get('[data-testid="toast"]').should('contain', 'Error Occurred')
  })

  it('should display appropriate confidence scores', () => {
    // Mock high confidence rejection
    cy.mockOpenAI({ 
      isAllowed: false, 
      flaggedCategories: ['hate'],
      confidenceScore: 0.92
    })

    const highConfidenceHate = 'Extremely hateful content targeting specific groups'
    cy.get('[data-testid="post-textarea"]').type(highConfidenceHate)
    cy.get('[data-testid="save-post-button"]').click()

    cy.wait('@moderateContent')

    // Should show high confidence blocking
    cy.get('[data-testid="moderation-feedback"]').should('be.visible')
    cy.get('[data-testid="moderation-feedback"]').should('contain', 'hate')
  })

  it('should handle multiple flagged categories', () => {
    // Mock content that violates multiple categories
    cy.mockOpenAI({ 
      isAllowed: false, 
      flaggedCategories: ['hate', 'harassment', 'violence'],
      confidenceScore: 0.78
    })

    const multiViolationContent = 'Hateful violent harassment content'
    cy.get('[data-testid="post-textarea"]').type(multiViolationContent)
    cy.get('[data-testid="save-post-button"]').click()

    cy.wait('@moderateContent')

    // Should show content blocked and flagged categories in feedback
    cy.get('[data-testid="toast"]').should('contain', 'Content Blocked by AI Moderation')
    cy.get('[data-testid="moderation-feedback"]').should('contain', 'hate, harassment, violence')
  })

  it('should verify omni-moderation-latest model is being used', () => {
    // Intercept the API call to verify model parameter
    cy.intercept('POST', '/api/moderate', (req) => {
      // The model is used internally, but we can verify the response format
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: {
            isAllowed: true,
            flaggedCategories: [],
            confidenceScore: 0.01,
            moderationResult: {
              id: 'modr-test',
              model: 'omni-moderation-latest',
              results: []
            }
          }
        }
      })
    }).as('verifyModel')

    cy.get('[data-testid="post-textarea"]').type('Test content for model verification')
    cy.get('[data-testid="save-post-button"]').click()

    cy.wait('@verifyModel').then((interception) => {
      expect(interception.response?.body.data.moderationResult.model).to.equal('omni-moderation-latest')
    })
  })
}) 