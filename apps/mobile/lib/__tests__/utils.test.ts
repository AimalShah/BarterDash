import { cn } from '../utils';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge tailwind classes correctly', () => {
      const result = cn('px-4 py-2', 'bg-blue-500');
      expect(result).toBe('px-4 py-2 bg-blue-500');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('px-4', isActive && 'bg-blue-500');
      expect(result).toBe('px-4 bg-blue-500');
    });

    it('should filter out falsy values', () => {
      const result = cn('px-4', false && 'hidden', null, undefined, 'py-2');
      expect(result).toBe('px-4 py-2');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['px-4', 'py-2'], 'bg-blue-500');
      expect(result).toBe('px-4 py-2 bg-blue-500');
    });

    it('should merge conflicting tailwind classes', () => {
      const result = cn('px-4', 'px-6');
      expect(result).toBe('px-6');
    });

    it('should handle objects with conditional classes', () => {
      const result = cn('px-4', { 'bg-blue-500': true, 'hidden': false });
      expect(result).toBe('px-4 bg-blue-500');
    });

    it('should return empty string for no inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });
  });
});
