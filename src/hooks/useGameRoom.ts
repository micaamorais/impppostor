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
  secret_word?: string | null;
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
  status: 'waiting_clues' | 'voting' | 'finished';
  created_at: string;
  finished_at: string | null;
};

// Función para generar código único de sala
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Lista de palabras para el juego
const WORD_LIST = ['Pizza', 'Playa', 'Guitarra', 'Montaña', 'Café', 'Libro', 'Fútbol', 'Perro', 'Lluvia', 'Verano', 'Luna', 'Cine', 'Chocolate', 'Bicicleta', 'Fiesta', 'Casa', 'Amigo', 'Escuela', 'Música', 'Auto', 'Flor', 'Sol', 'Computadora', 'Mar', 'Río', 'Ciudad', 'Comida', 'Familia', 'Trabajo', 'Bosque', 'Campo', 'Ropa', 'Teléfono', 'Reloj', 'Camino', 'Zapato', 'Silla', 'Ventana', 'Puerta', 'Montaña', 'Corazón', 'Niño', 'Película', 'Avión', 'Helado', 'Cama', 'Pan', 'Taza', 'Foto', 'Jardín', 'Montaña', 'Nieve', 'Sueño', 'Juego', 'Tiempo', 'Agua', 'Fuego', 'Estrella', 'Cielo', 'Amor', 'Beso', 'Risa', 'Mundo', 'Plaza', 'Tierra', 'Escenario'];

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
      if (!allPlayers || allPlayers.length < 3) {
        throw new Error('Se necesitan al menos 3 lotsos');
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
        const { error: upErr } = await supabase
          .from('players')
          .update({ role })
          .eq('id', shuffled[i].id);
        if (upErr) throw new Error(upErr.message);
      }

      // Select secret word for the entire game
      const secretWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
      
      // Actualizar estado de la sala con la palabra secreta
      const { error: roomUpdateErr } = await supabase
        .from('rooms')
        .update({
          status: 'playing',
          started_at: new Date().toISOString(),
          current_round: 1,
          secret_word: secretWord
        })
        .eq('id', roomId)
        .select('*');
      if (roomUpdateErr) throw new Error(roomUpdateErr.message);

      // Crear primera ronda sin palabra (la palabra está en room)
      const { data: firstRound, error: roundError } = await supabase
        .from('rounds')
        .insert({
          room_id: roomId,
          round_number: 1,
          status: 'waiting_clues',
          secret_word: secretWord
        })
        .select('*')
        .single();

      if (roundError) throw new Error(roundError.message);

      console.log('[DEBUG] firstRound creado:', firstRound);

      // Update local state immediately to ensure GamePhase renders
      setCurrentRound(firstRound);

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

      // Cargar la ronda actual inicialmente
      await refreshRoundData();

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

  // Reiniciar el juego con los mismos jugadores (reasignar roles aleatoriamente, nueva palabra secreta)
  const restartGame = async (roomId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Obtener todos los jugadores
      const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId);

      if (playersError) throw playersError;
      if (!allPlayers || allPlayers.length < 3) {
        throw new Error('Se necesitan al menos 3 lotsos');
      }

      const { data: roomData } = await supabase
        .from('rooms')
        .select('impostor_count')
        .eq('id', roomId)
        .single();

      if (!roomData) throw new Error('Sala no encontrada');

      // Resetear is_alive para todos los jugadores
      await supabase
        .from('players')
        .update({ is_alive: true })
        .eq('room_id', roomId);

      // Asignar roles aleatoriamente
      const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);
      const impostorCount = roomData.impostor_count;

      for (let i = 0; i < shuffled.length; i++) {
        const role = i < impostorCount ? 'impostor' : 'player';
        const { error: upErr } = await supabase
          .from('players')
          .update({ role })
          .eq('id', shuffled[i].id);
        if (upErr) throw new Error(upErr.message);
      }

      // Select new secret word
      const secretWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];

      // Get all existing round ids for the room
      const { data: existingRounds } = await supabase
        .from('rounds')
        .select('id')
        .eq('room_id', roomId);

      const roundIds = existingRounds?.map(r => r.id) || [];

      // Delete clues and votes for these rounds
      if (roundIds.length > 0) {
        await supabase.from('clues').delete().in('round_id', roundIds);
        await supabase.from('votes').delete().in('round_id', roundIds);
      }

      // Delete rounds
      const { error: deleteRoundsErr } = await supabase
        .from('rounds')
        .delete()
        .eq('room_id', roomId);
      if (deleteRoundsErr) throw new Error(deleteRoundsErr.message);

      // Actualizar estado de la sala con la nueva palabra secreta PRIMERO
      const { data: updatedRoom, error: roomUpdateErr } = await supabase
        .from('rooms')
        .update({
          status: 'playing',
          current_round: 1,
          secret_word: secretWord
        })
        .eq('id', roomId)
        .select('*')
        .single();

      if (roomUpdateErr) throw new Error(roomUpdateErr.message);

      // Crear nueva primera ronda DESPUÉS de actualizar la sala
      const { data: firstRound, error: roundError } = await supabase
        .from('rounds')
        .insert({
          room_id: roomId,
          round_number: 1,
          status: 'waiting_clues',
          secret_word: secretWord
        })
        .select('*')
        .single();

      if (roundError) throw new Error(roundError.message);

      // Update local state immediately
      if (firstRound) {
        setCurrentRound(firstRound);
      }
      if (updatedRoom) {
        setRoom(updatedRoom);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reiniciar el juego');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Salir al lobby (volver a estado waiting)
  const exitToLobby = async (roomId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Resetear todos los jugadores: role = 'player', is_alive = true
      const { error: playersResetErr } = await supabase
        .from('players')
        .update({
          role: 'player',
          is_alive: true
        })
        .eq('room_id', roomId);

      if (playersResetErr) throw new Error(playersResetErr.message);

      // Actualizar estado de la sala a waiting, resetear current_round y limpiar secret_word
      const { error: roomUpdateErr } = await supabase
        .from('rooms')
        .update({
          status: 'waiting',
          current_round: 0,
          secret_word: null
        })
        .eq('id', roomId);

      if (roomUpdateErr) throw new Error(roomUpdateErr.message);

      // Clear local state to avoid remnants from previous round
      setCurrentRound(null);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al salir al lobby');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    room,
    players,
    currentRound,
    loading,
    error,
    createRoom,
    joinRoom,
    startGame,
    restartGame,
    exitToLobby
  };
};
