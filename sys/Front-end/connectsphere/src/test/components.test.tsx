import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/Input';

describe('UI Components', () => {
  describe('Button Component', () => {
    it('renders button with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('applies default variant class', () => {
      render(<Button>Default</Button>);
      const button = screen.getByText('Default');
      expect(button).toHaveClass('bg-gradient-to-r');
      expect(button).toHaveClass('from-primary-600');
    });

    it('applies success variant class', () => {
      render(<Button variant="success">Success</Button>);
      const button = screen.getByText('Success');
      expect(button).toHaveClass('from-green-500');
      expect(button).toHaveClass('to-green-600');
    });

    it('handles disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByText('Disabled');
      expect(button).toBeDisabled();
    });

    it('renders with loading state', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByText('Loading')).toBeInTheDocument();
    });
  });

  describe('Card Component', () => {
    it('renders card with children', () => {
      render(
        <Card>
          <div>Card content</div>
        </Card>
      );
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies elevated variant', () => {
      render(<Card variant="elevated">Elevated Card</Card>);
      const card = screen.getByText('Elevated Card');
      expect(card).toBeInTheDocument();
    });

    it('applies custom padding', () => {
      render(<Card padding="lg">Padded Card</Card>);
      const card = screen.getByText('Padded Card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Badge Component', () => {
    it('renders badge with text', () => {
      render(<Badge>Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('applies success variant class', () => {
      render(<Badge variant="success">Success</Badge>);
      const badge = screen.getByText('Success');
      expect(badge).toHaveClass('from-green-500');
    });

    it('applies warning variant class', () => {
      render(<Badge variant="warning">Warning</Badge>);
      const badge = screen.getByText('Warning');
      expect(badge).toHaveClass('from-amber-500');
    });

    it('applies danger variant class', () => {
      render(<Badge variant="danger">Danger</Badge>);
      const badge = screen.getByText('Danger');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Input Component', () => {
    it('renders input field', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Email" />);
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('displays error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('applies error styling when error exists', () => {
      render(<Input error="Error" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-danger-500');
    });
  });
});

