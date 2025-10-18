import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Room = {
  id: string;
  code: string;
  status: 'waiting' | 'playing' | 'finished';
  max_players: number;
  impostor_count: number;
  max_rounds: number;
  current_round: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

type Player = {
  id: string;
  room_id: string;
  name: string;
  role: 'player' | 'impostor';
  is_alive: boolean;
  is_host: boolean;
  joined_at: string;
};

type Round = {
  id: string;
  room_id: string;
  round_number: number;
  secret_word: string;
  status: 'waiting_clues' | 'voting' | 'finished';
  current_turn_player_id: string | null;
  created_at: string;
  finished_at: string | null;
};

// Función para generar código único de sala
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Lista de palabras para el juego
const WORD_LIST = [
  'Pizza', 'Playa', 'Guitarra', 'Montaña', 'Café', 'Libro', 'Fútbol', 'Perro',
  'Lluvia', 'Verano', 'Luna', 'Cine', 'Chocolate', 'Bicicleta', 'Fiesta'
];

export const useGameRoom = (roomCode?: string) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crear una nueva sala
  const createRoom = async (maxPlayers: number, impostorCount: number, maxRounds: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const code = generateRoomCode();
      
      const { data, error: createError } = await supabase
        .from('rooms')
        .insert({
          code,
          max_players: maxPlayers,
          impostor_count: impostorCount,
          max_rounds: maxRounds,
          status: 'waiting'
        })
        .select()
        .single();

      if (createError) throw createError;
      
      setRoom(data);
      return data.code;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la sala');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Unirse a una sala
  const joinRoom = async (code: string, playerName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Buscar la sala
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (roomError) throw new Error('Sala no encontrada');
      if (roomData.status !== 'waiting') throw new Error('La sala ya comenzó');

      // Contar jugadores actuales
      const { count } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomData.id);

      if (count && count >= roomData.max_players) {
        throw new Error('La sala está llena');
      }

      const isHost = count === 0;

      // Agregar jugador
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: roomData.id,
          name: playerName,
          is_host: isHost
        })
        .select()
        .single();

      if (playerError) throw playerError;

      setRoom(roomData);
      return { room: roomData, player: playerData };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al unirse a la sala');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Iniciar el juego (solo el host)
  const startGame = async (roomId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Obtener todos los jugadores
      const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId);

      if (playersError) throw playersError;
      if (!allPlayers || allPlayers.length < 4) {
        throw new Error('Se necesitan al menos 4 jugadores');
      }

      const { data: roomData } = await supabase
        .from('rooms')
        .select('impostor_count')
        .eq('id', roomId)
        .single();

      if (!roomData) throw new Error('Sala no encontrada');

      // Asignar roles aleatoriamente
      const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);
      const impostorCount = roomData.impostor_count;
      
      for (let i = 0; i < shuffled.length; i++) {
        const role = i < impostorCount ? 'impostor' : 'player';
        await supabase
          .from('players')
          .update({ role })
          .eq('id', shuffled[i].id);
      }

      // Actualizar estado de la sala
      await supabase
        .from('rooms')
        .update({ 
          status: 'playing', 
          started_at: new Date().toISOString(),
          current_round: 1
        })
        .eq('id', roomId);

      // Crear primera ronda con el primer jugador vivo en turno
      const secretWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
      const firstPlayer = allPlayers.find(p => p.is_alive);
      await supabase
        .from('rounds')
        .insert({
          room_id: roomId,
          round_number: 1,
          secret_word: secretWord,
          status: 'waiting_clues',
          current_turn_player_id: firstPlayer?.id || null
        });

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar el juego');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!roomCode) return;

    const setupRealtimeSubscriptions = async () => {
      // Obtener sala por código
      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode.toUpperCase())
        .single();

      if (!roomData) return;

      setRoom(roomData);

      // Función para refrescar datos de la sala
      const refreshRoomData = async () => {
        const { data } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomData.id)
          .single();
        
        if (data) setRoom(data);
      };

      // Suscripción a cambios en la sala
      const roomChannel = supabase
        .channel('room-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'rooms',
            filter: `id=eq.${roomData.id}`
          },
          async () => {
            await refreshRoomData();
          }
        )
        .subscribe();

      // Función para refrescar datos de jugadores
      const refreshPlayersData = async () => {
        const { data } = await supabase
          .from('players')
          .select('*')
          .eq('room_id', roomData.id)
          .order('joined_at');
        
        if (data) setPlayers(data);
      };

      // Suscripción a cambios en jugadores
      const playersChannel = supabase
        .channel('players-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'players',
            filter: `room_id=eq.${roomData.id}`
          },
          async () => {
            await refreshPlayersData();
          }
        )
        .subscribe();

      // Obtener jugadores iniciales
      const { data: initialPlayers } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomData.id)
        .order('joined_at');
      
      if (initialPlayers) setPlayers(initialPlayers);

      // Función para refrescar datos de rondas
      const refreshRoundData = async () => {
        const { data } = await supabase
          .from('rounds')
          .select('*')
          .eq('room_id', roomData.id)
          .order('round_number', { ascending: false })
          .limit(1)
          .single();
        
        if (data) setCurrentRound(data);
      };

      // Suscripción a rondas
      const roundsChannel = supabase
        .channel('rounds-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rounds',
            filter: `room_id=eq.${roomData.id}`
          },
          async () => {
            await refreshRoundData();
            // También refrescamos los datos de la sala para asegurar sincronización
            await refreshRoomData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(roomChannel);
        supabase.removeChannel(playersChannel);
        supabase.removeChannel(roundsChannel);
      };
    };

    setupRealtimeSubscriptions();
  }, [roomCode]);

  return {
    room,
    players,
    currentRound,
    loading,
    error,
    createRoom,
    joinRoom,
    startGame
  };
};
