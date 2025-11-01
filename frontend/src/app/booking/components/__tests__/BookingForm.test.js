import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookingForm from '../BookingForm';

describe('BookingForm', () => {
  const mockUser = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
  };

  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(
      <BookingForm
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        loading={false}
        error={null}
        user={mockUser}
      />
    );

    expect(screen.getByText('Confirm Your Booking')).toBeInTheDocument();
    expect(screen.getByLabelText(/special request/i)).toBeInTheDocument();
    expect(screen.getByText("Driver's License Information")).toBeInTheDocument();
  });

  it('shows error message when error prop is provided', () => {
    const errorMessage = 'This is an error';
    render(
      <BookingForm
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        loading={false}
        error={errorMessage}
        user={mockUser}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('disables submit button when terms not agreed', async () => {
    render(
      <BookingForm
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        loading={false}
        error={null}
        user={mockUser}
      />
    );

    const submitButton = screen.getByRole('button', { name: /confirm booking/i });
    expect(submitButton).toBeDisabled();
  });

  it('calls onConfirm when form is submitted with valid data', async () => {
    // Mock FileReader
    global.FileReader = class FileReader {
      readAsDataURL() {
        this.result = 'data:image/png;base64,test';
        this.onloadend();
      }
    };

    render(
      <BookingForm
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        loading={false}
        error={null}
        user={mockUser}
      />
    );

    // Upload license file
    const fileInput = screen.getByLabelText(/license/i);
    const file = new File(['test'], 'license.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Accept terms
    const termsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(termsCheckbox);

    // Fill special request
    const textarea = screen.getByLabelText(/special request/i);
    fireEvent.change(textarea, { target: { value: 'Please deliver at airport' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: /confirm booking/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('Please deliver at airport', expect.any(File));
    });
  });

  it('shows loading state when processing', () => {
    render(
      <BookingForm
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        loading={true}
        error={null}
        user={mockUser}
      />
    );

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });
});

