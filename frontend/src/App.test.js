import { render, screen } from '@testing-library/react';
import App from './App';

test('renders navbar with NexusMind AI', () => {
  render(<App />);
  const navbarElement = screen.getByText(/NexusMind AI/i);
  expect(navbarElement).toBeInTheDocument();
});
