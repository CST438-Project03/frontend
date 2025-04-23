import { renderHook } from '@testing-library/react-hooks';
import { useEffect, useState } from 'react';

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve([
        { rawgId: '1', title: 'Game 1', imageUrl: 'https://example.com/game1.jpg' },
        { rawgId: '2', title: 'Game 2', imageUrl: 'https://example.com/game2.jpg' },
      ]),
  })
) as jest.Mock;

function useFetchGames() {
  const [games, setGames] = useState([]);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/games/fetchFromRawg');
        const data = await response.json();
        setGames(data);
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    };

    fetchGames();
  }, []);

  return games;
}

describe('useFetchGames', () => {
  it('fetches and sets games correctly', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useFetchGames());

    // Wait for the state to update
    await waitForNextUpdate();

    expect(result.current).toEqual([
      { rawgId: '1', title: 'Game 1', imageUrl: 'https://example.com/game1.jpg' },
      { rawgId: '2', title: 'Game 2', imageUrl: 'https://example.com/game2.jpg' },
    ]);

    // Ensure fetch was called with the correct URL
    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/games/fetchFromRawg');
  });
});
