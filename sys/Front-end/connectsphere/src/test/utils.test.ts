import { describe, it, expect } from 'vitest';

describe('Utility Functions', () => {
  describe('Price Calculations', () => {
    it('calculates savings percentage correctly', () => {
      const originalPrice = 100;
      const bulkPrice = 70;
      const savings = ((originalPrice - bulkPrice) / originalPrice) * 100;
      expect(savings).toBe(30);
    });

    it('handles zero original price', () => {
      const originalPrice = 0;
      const bulkPrice = 70;
      const savings = originalPrice > 0 ? ((originalPrice - bulkPrice) / originalPrice) * 100 : 0;
      expect(savings).toBe(0);
    });

    it('calculates total price correctly', () => {
      const quantity = 5;
      const unitPrice = 24.99;
      const total = parseFloat((quantity * unitPrice).toFixed(2));
      expect(total).toBe(124.95);
    });
  });

  describe('Date Formatting', () => {
    it('formats date to locale string', () => {
      const date = new Date('2024-11-19');
      const formatted = date.toLocaleDateString();
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('calculates days until deadline', () => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);
      const today = new Date();
      const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysUntil).toBeGreaterThanOrEqual(6);
      expect(daysUntil).toBeLessThanOrEqual(7);
    });
  });

  describe('Progress Calculations', () => {
    it('calculates group progress correctly', () => {
      const currentParticipants = 35;
      const maxParticipants = 50;
      const progress = (currentParticipants / maxParticipants) * 100;
      expect(progress).toBe(70);
    });

    it('caps progress at 100%', () => {
      const currentParticipants = 60;
      const maxParticipants = 50;
      const progress = Math.min((currentParticipants / maxParticipants) * 100, 100);
      expect(progress).toBe(100);
    });

    it('handles zero max participants', () => {
      const currentParticipants = 10;
      const maxParticipants = 0;
      const progress = maxParticipants > 0 ? (currentParticipants / maxParticipants) * 100 : 0;
      expect(progress).toBe(0);
    });
  });

  describe('String Formatting', () => {
    it('formats currency correctly', () => {
      const amount = 1234.56;
      const formatted = amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
      expect(formatted).toContain('1,234.56');
    });

    it('truncates long text', () => {
      const text = 'This is a very long text that needs to be truncated';
      const maxLength = 20;
      const truncated = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
      expect(truncated).toBe('This is a very long ...');
    });
  });

  describe('Array Operations', () => {
    it('filters active groups', () => {
      const groups = [
        { id: 1, status: 'active' },
        { id: 2, status: 'completed' },
        { id: 3, status: 'active' },
      ];
      const activeGroups = groups.filter(g => g.status === 'active');
      expect(activeGroups).toHaveLength(2);
      expect(activeGroups[0].id).toBe(1);
    });

    it('sorts by date correctly', () => {
      const items = [
        { date: '2024-11-15' },
        { date: '2024-11-20' },
        { date: '2024-11-10' },
      ];
      const sorted = [...items].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      expect(sorted[0].date).toBe('2024-11-20');
      expect(sorted[2].date).toBe('2024-11-10');
    });
  });

  describe('Validation Functions', () => {
    it('validates email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test('user@example.com')).toBe(true);
      expect(emailRegex.test('invalid-email')).toBe(false);
      expect(emailRegex.test('user@domain')).toBe(false);
    });

    it('validates password strength', () => {
      const strongPassword = 'Password123!';
      const weakPassword = 'pass';
      expect(strongPassword.length >= 8).toBe(true);
      expect(weakPassword.length >= 8).toBe(false);
    });

    it('validates positive numbers', () => {
      const isPositive = (num: number) => num > 0;
      expect(isPositive(10)).toBe(true);
      expect(isPositive(-5)).toBe(false);
      expect(isPositive(0)).toBe(false);
    });
  });

  describe('Local Storage Operations', () => {
    it('stores and retrieves values', () => {
      const key = 'testKey';
      const value = 'testValue';
      localStorage.setItem(key, value);
      expect(localStorage.getItem(key)).toBe(value);
    });

    it('removes values', () => {
      const key = 'testKey';
      localStorage.setItem(key, 'value');
      localStorage.removeItem(key);
      expect(localStorage.getItem(key)).toBeNull();
    });

    it('stores JSON objects', () => {
      const key = 'user';
      const user = { id: 1, name: 'John' };
      localStorage.setItem(key, JSON.stringify(user));
      const retrieved = JSON.parse(localStorage.getItem(key) || '{}');
      expect(retrieved.id).toBe(1);
      expect(retrieved.name).toBe('John');
    });
  });
});

