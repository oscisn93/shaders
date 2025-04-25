
import Home from './page';

describe('Home', () => {
  it('renders without crashing', () => {
    render(<Home />);
  });

  it('renders the correct title', () => {
    render(<Home />);
    const titleElement = screen.getByText(/Sudoku Zen Garden/i);
    expect(titleElement).toBeInTheDocument();
  });
});