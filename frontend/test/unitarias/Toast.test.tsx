import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast from '../../src/components/Toast';

describe('Toast Component', () => {
  let onCloseMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onCloseMock = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render success toast with correct styling', () => {
      render(<Toast message="Success message" type="success" onClose={onCloseMock} />);

      expect(screen.getByText('Success message')).toBeInTheDocument();
      const container = screen.getByText('Success message').closest('div');
      expect(container?.className).toContain('bg-green-500');
    });

    it('should render error toast with correct styling', () => {
      render(<Toast message="Error message" type="error" onClose={onCloseMock} />);

      expect(screen.getByText('Error message')).toBeInTheDocument();
      const container = screen.getByText('Error message').closest('div');
      expect(container?.className).toContain('bg-red-500');
    });

    it('should render info toast with correct styling', () => {
      render(<Toast message="Info message" type="info" onClose={onCloseMock} />);

      expect(screen.getByText('Info message')).toBeInTheDocument();
      const container = screen.getByText('Info message').closest('div');
      expect(container?.className).toContain('bg-blue-500');
    });

    it('should display correct icon for success type', () => {
      const { container } = render(
        <Toast message="Success" type="success" onClose={onCloseMock} />
      );

      const checkIcon = container.querySelector('path[d*="M5 13l4 4L19 7"]');
      expect(checkIcon).toBeInTheDocument();
    });

    it('should display correct icon for error type', () => {
      const { container } = render(
        <Toast message="Error" type="error" onClose={onCloseMock} />
      );

      const errorIcon = container.querySelector('path[d*="M6 18L18 6M6 6l12 12"]');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should display correct icon for info type', () => {
      const { container } = render(
        <Toast message="Info" type="info" onClose={onCloseMock} />
      );

      const infoIcon = container.querySelector('path[d*="M13 16h-1v-4h-1m1-4h.01"]');
      expect(infoIcon).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should have a close button', () => {
      render(<Toast message="Test message" type="success" onClose={onCloseMock} />);

      const closeButton = screen.getByLabelText('Cerrar');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Auto-dismiss', () => {
    it('should auto-dismiss after default duration (4000ms)', () => {
      render(<Toast message="Auto dismiss" type="success" onClose={onCloseMock} />);

      expect(onCloseMock).not.toHaveBeenCalled();

      vi.advanceTimersByTime(4000);

      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('should auto-dismiss after custom duration', () => {
      render(
        <Toast
          message="Custom duration"
          type="success"
          onClose={onCloseMock}
          duration={2000}
        />
      );

      vi.advanceTimersByTime(1999);
      expect(onCloseMock).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('should not auto-dismiss before duration completes', () => {
      render(<Toast message="Wait" type="success" onClose={onCloseMock} />);

      vi.advanceTimersByTime(3999);
      expect(onCloseMock).not.toHaveBeenCalled();
    });
  });
});
