import { render, screen } from '@testing-library/react';
import Header from '../Header';

// Mock useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    logout: jest.fn(),
  }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
  }),
  usePathname: () => '/',
}));

describe('Header Component', () => {
  it('renders the header', () => {
    render(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('displays the logo', () => {
    render(<Header />);
    const logo = screen.getByText(/airbcar/i);
    expect(logo).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Header />);
    // Check for navigation links (adjust based on actual Header content)
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});

