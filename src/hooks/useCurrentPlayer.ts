import { useState, useEffect } from 'react';

export const useCurrentPlayer = (roomCode: string | null) => {
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (!roomCode) return;

    // Recuperar ID del jugador desde localStorage
    const storedPlayerId = localStorage.getItem(`player_${roomCode}`);
    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
    }
  }, [roomCode]);

  const savePlayerId = (id: string, roomCode: string) => {
    localStorage.setItem(`player_${roomCode}`, id);
    setPlayerId(id);
  };

  return { playerId, savePlayerId };
};
