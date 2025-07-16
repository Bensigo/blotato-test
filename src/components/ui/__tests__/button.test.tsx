import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import Button from '../button'

describe('Button Component', () => {
  describe('Basic Functionality', () => {
    it('should render with children', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('should handle click events', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledOnce()
    })

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled button</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should be disabled when loading prop is true', () => {
      render(<Button loading>Loading button</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should not trigger click when disabled', () => {
      const handleClick = vi.fn()
      render(<Button disabled onClick={handleClick}>Disabled button</Button>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Variants', () => {
    it('should apply default variant classes', () => {
      render(<Button>Default</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-blue-600', 'text-white')
    })

    it('should apply destructive variant classes', () => {
      render(<Button variant="destructive">Delete</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-red-600', 'text-white')
    })

    it('should apply outline variant classes', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border', 'border-gray-300', 'bg-transparent')
    })

    it('should apply secondary variant classes', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gray-100', 'text-gray-900')
    })

    it('should apply ghost variant classes', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-gray-100', 'hover:text-gray-900')
    })

    it('should apply link variant classes', () => {
      render(<Button variant="link">Link</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-blue-600', 'underline-offset-4')
    })
  })

  describe('Sizes', () => {
    it('should apply default size classes', () => {
      render(<Button>Default size</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'px-4', 'py-2')
    })

    it('should apply small size classes', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9', 'px-3')
    })

    it('should apply large size classes', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-11', 'px-8')
    })

    it('should apply icon size classes', () => {
      render(<Button size="icon">🔥</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'w-10')
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      render(<Button loading>Loading</Button>)
      const spinner = screen.getByRole('button').querySelector('svg')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })

    it('should not show loading spinner when not loading', () => {
      render(<Button>Not loading</Button>)
      const spinner = screen.getByRole('button').querySelector('svg')
      expect(spinner).not.toBeInTheDocument()
    })

    it('should show loading spinner and children', () => {
      render(<Button loading>Loading button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('Loading button')
      expect(button.querySelector('svg')).toBeInTheDocument()
    })

    it('should be disabled during loading', () => {
      const handleClick = vi.fn()
      render(<Button loading onClick={handleClick}>Loading</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should merge custom className with variant classes', () => {
      render(<Button variant="destructive" className="custom-class">Custom</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class', 'bg-red-600', 'text-white')
    })

    it('should accept data attributes', () => {
      render(<Button data-testid="custom-button">Custom</Button>)
      expect(screen.getByTestId('custom-button')).toBeInTheDocument()
    })

    it('should accept aria attributes', () => {
      render(<Button aria-label="Custom button">Custom</Button>)
      expect(screen.getByLabelText('Custom button')).toBeInTheDocument()
    })

    it('should forward button HTML attributes', () => {
      render(<Button type="submit" form="test-form">Submit</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('form', 'test-form')
    })
  })

  describe('Base Component Classes', () => {
    it('should always include base button classes', () => {
      render(<Button>Base</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'inline-flex',
        'items-center',
        'justify-center',
        'rounded-md',
        'font-medium',
        'transition-colors'
      )
    })

    it('should include focus styles', () => {
      render(<Button>Focus</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-ring',
        'focus-visible:ring-offset-2'
      )
    })

    it('should include disabled styles', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })
  })

  describe('Ref Forwarding', () => {
    it('should forward ref to button element', () => {
      const ref = React.createRef<HTMLButtonElement>()
      render(<Button ref={ref}>Ref test</Button>)
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
      expect(ref.current?.textContent).toBe('Ref test')
    })

    it('should allow calling focus on ref', () => {
      const ref = React.createRef<HTMLButtonElement>()
      render(<Button ref={ref}>Focus test</Button>)
      
      ref.current?.focus()
      expect(ref.current).toHaveFocus()
    })
  })

  describe('Variant and Size Combinations', () => {
    it('should combine different variants and sizes correctly', () => {
      render(<Button variant="outline" size="lg">Large Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border', 'border-gray-300', 'h-11', 'px-8')
    })

    it('should handle ghost variant with small size', () => {
      render(<Button variant="ghost" size="sm">Small Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-gray-100', 'h-9', 'px-3')
    })

    it('should handle icon button with secondary variant', () => {
      render(<Button variant="secondary" size="icon">⚙️</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gray-100', 'h-10', 'w-10')
    })
  })

  describe('Edge Cases', () => {
    it('should handle both disabled and loading props', () => {
      render(<Button disabled loading>Both disabled and loading</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button.querySelector('svg')).toBeInTheDocument()
    })

    it('should handle empty children', () => {
      render(<Button></Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button.textContent).toBe('')
    })

    it('should handle complex children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      )
      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('IconText')
    })

    it('should not interfere with asChild prop (even though not implemented)', () => {
      render(<Button asChild>As child</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })
}) 