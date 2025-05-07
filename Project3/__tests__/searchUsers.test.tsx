import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SearchScreen from '../app/(tabs)/search';

global.fetch = jest.fn();

describe('SearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the search screen correctly', () => {
    const { getByPlaceholderText, getByText } = render(<SearchScreen />);
    expect(getByPlaceholderText('Search for games or users...')).toBeTruthy();
    expect(getByText('Search')).toBeTruthy();
  });

  it('fetches and displays users when a search query is entered', async () => {
    const mockUsers = [
      { id: 1, username: 'john_doe' },
      { id: 2, username: 'jane_doe' },
    ];
    const mockGames = [];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGames,
    });
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    const { getByPlaceholderText, getByText, findByText } = render(<SearchScreen />);
    const searchInput = getByPlaceholderText('Search for games or users...');

    fireEvent.changeText(searchInput, 'john');
    fireEvent(searchInput, 'submitEditing');

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/games/search?query=john'
    );
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/user/search?query=john'
    );

    await waitFor(() => expect(findByText('john_doe')).toBeTruthy());
    await waitFor(() => expect(findByText('jane_doe')).toBeTruthy());
  });

  it('displays an error message if the fetch fails', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { getByPlaceholderText, getByText, findByText } = render(<SearchScreen />);
    const searchInput = getByPlaceholderText('Search for games or users...');

    fireEvent.changeText(searchInput, 'error');
    fireEvent(searchInput, 'submitEditing');

    await waitFor(() => expect(findByText('Search error:')).toBeTruthy());
  });
});
