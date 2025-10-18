import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

type Player = {
  id: string;
  name: string;
  role: 'player' | 'impostor';
  is_alive: boolean;
};

type Round = {
  id: string;
  room_id: string;
  round_number: number;
  secret_word: string;
  status: 'waiting_clues' | 'voting' | 'finished';
  current_turn_player_id: string | null;
};

type Clue = {
  id: string;
  player_id: string;
  clue_text: string;
};

type Vote = {
  id: string;
  voter_id: string;
  voted_player_id: string;
};

type GamePhaseProps = {
  roomId: string;
  currentRound: Round;
  players: Player[];
  currentPlayerId: string | null;
};

const GamePhase = ({ roomId, currentRound, players, currentPlayerId }: GamePhaseProps) => {
  const [clue, setClue] = useState("");
  const [clues, setClues] = useState<Clue[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [hasSubmittedClue, setHasSubmittedClue] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [showWord, setShowWord] = useState(false);
  const { toast } = useToast();

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isImpostor = currentPlayer?.role === 'impostor';
  const alivePlayers = players.filter(p => p.is_alive);

  useEffect(() => {
    // Suscribirse a clues
    const cluesChannel = supabase
      .channel('clues-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clues',
          filter: `round_id=eq.${currentRound.id}`
        },
        async () => {
          const { data } = await supabase
            .from('clues')
            .select('*')
            .eq('round_id', currentRound.id);
          if (data) setClues(data);
        }
      )
      .subscribe();

    // Obtener clues iniciales
    const fetchClues = async () => {
      const { data } = await supabase
        .from('clues')
        .select('*')
        .eq('round_id', currentRound.id);
      if (data) setClues(data);
    };
    fetchClues();

    // Verificar si ya envió su pista
    if (currentPlayerId) {
      const checkClue = async () => {
        const { data } = await supabase
          .from('clues')
          .select('*')
          .eq('round_id', currentRound.id)
          .eq('player_id', currentPlayerId)
          .single();
        if (data) setHasSubmittedClue(true);
      };
      checkClue();
    }

    return () => {
      supabase.removeChannel(cluesChannel);
    };
  }, [currentRound.id, currentPlayerId]);

  useEffect(() => {
    // Suscribirse a votos
    const votesChannel = supabase
      .channel('votes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `round_id=eq.${currentRound.id}`
        },
        async () => {
          const { data } = await supabase
            .from('votes')
            .select('*')
            .eq('round_id', currentRound.id);
          if (data) setVotes(data);
        }
      )
      .subscribe();

    // Obtener votos iniciales
    const fetchVotes = async () => {
      const { data } = await supabase
        .from('votes')
        .select('*')
        .eq('round_id', currentRound.id);
      if (data) setVotes(data);
    };
    fetchVotes();

    // Verificar si ya votó
    if (currentPlayerId) {
      const checkVote = async () => {
        const { data } = await supabase
          .from('votes')
          .select('*')
          .eq('round_id', currentRound.id)
          .eq('voter_id', currentPlayerId)
          .single();
        if (data) setHasVoted(true);
      };
      checkVote();
    }

    return () => {
      supabase.removeChannel(votesChannel);
    };
  }, [currentRound.id, currentPlayerId]);

  const handleSubmitClue = async () => {
    if (!clue.trim() || !currentPlayerId) return;

    try {
      const { error } = await supabase
        .from('clues')
        .insert({
          round_id: currentRound.id,
          player_id: currentPlayerId,
          clue_text: clue.trim()
        });

      if (error) throw error;

      setHasSubmittedClue(true);
      setClue("");
      toast({
        title: "¡Pista enviada!",
        description: "Turno del siguiente jugador",
      });

      // Pasar al siguiente jugador
      const currentIndex = alivePlayers.findIndex(p => p.id === currentPlayerId);
      const nextIndex = (currentIndex + 1) % alivePlayers.length;
      const nextPlayer = alivePlayers[nextIndex];

      // Si todos enviaron su pista, pasar a votación
      if (clues.length + 1 >= alivePlayers.length) {
        await supabase
          .from('rounds')
          .update({ 
            status: 'voting',
            current_turn_player_id: null
          })
          .eq('id', currentRound.id);
      } else {
        // Actualizar al siguiente jugador en turno
        await supabase
          .from('rounds')
          .update({ current_turn_player_id: nextPlayer.id })
          .eq('id', currentRound.id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo enviar la pista",
        variant: "destructive",
      });
    }
  };

  const handleVote = async (votedPlayerId: string) => {
    if (!currentPlayerId || hasVoted) return;

    try {
      const { error } = await supabase
        .from('votes')
        .insert({
          round_id: currentRound.id,
          voter_id: currentPlayerId,
          voted_player_id: votedPlayerId
        });

      if (error) throw error;

      setHasVoted(true);
      toast({
        title: "¡Voto registrado!",
        description: "Esperando a los demás jugadores",
      });

      // Si todos votaron, calcular resultado
      if (votes.length + 1 >= alivePlayers.length) {
        await calculateRoundResult();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo registrar el voto",
        variant: "destructive",
      });
    }
  };

  const calculateRoundResult = async () => {
    const { data: allVotes } = await supabase
      .from('votes')
      .select('*')
      .eq('round_id', currentRound.id);

    if (!allVotes) return;

    // Contar votos
    const voteCounts: { [key: string]: number } = {};
    allVotes.forEach(vote => {
      voteCounts[vote.voted_player_id] = (voteCounts[vote.voted_player_id] || 0) + 1;
    });

    // Encontrar el más votado
    let maxVotes = 0;
    let eliminatedPlayerId = '';
    Object.entries(voteCounts).forEach(([playerId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedPlayerId = playerId;
      }
    });

    // Eliminar al jugador
    if (eliminatedPlayerId) {
      await supabase
        .from('players')
        .update({ is_alive: false })
        .eq('id', eliminatedPlayerId);
    }

    // Finalizar ronda
    await supabase
      .from('rounds')
      .update({ 
        status: 'finished',
        finished_at: new Date().toISOString()
      })
      .eq('id', currentRound.id);

    // Verificar condiciones de fin de juego
    const { data: updatedPlayers } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_alive', true);

    if (!updatedPlayers) return;

    const aliveImpostors = updatedPlayers.filter(p => p.role === 'impostor').length;
    const aliveRegular = updatedPlayers.filter(p => p.role === 'player').length;

    if (aliveImpostors === 0 || aliveRegular <= aliveImpostors) {
      // Juego terminado
      await supabase
        .from('rooms')
        .update({ 
          status: 'finished',
          finished_at: new Date().toISOString()
        })
        .eq('id', roomId);
    } else {
      // Siguiente ronda
      const { data: room } = await supabase
        .from('rooms')
        .select('current_round, max_rounds')
        .eq('id', roomId)
        .single();

      if (room && room.current_round < room.max_rounds) {
        const nextRound = room.current_round + 1;
        await supabase
          .from('rooms')
          .update({ current_round: nextRound })
          .eq('id', roomId);

        // Crear siguiente ronda
        const WORD_LIST = [
          'Pizza', 'Playa', 'Guitarra', 'Montaña', 'Café', 'Libro', 'Fútbol', 'Perro',
          'Lluvia', 'Verano', 'Luna', 'Cine', 'Chocolate', 'Bicicleta', 'Fiesta'
        ];
        const secretWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
        const firstAlivePlayer = updatedPlayers[0];
        
        await supabase
          .from('rounds')
          .insert({
            room_id: roomId,
            round_number: nextRound,
            secret_word: secretWord,
            status: 'waiting_clues',
            current_turn_player_id: firstAlivePlayer?.id || null
          });
      } else {
        await supabase
          .from('rooms')
          .update({ 
            status: 'finished',
            finished_at: new Date().toISOString()
          })
          .eq('id', roomId);
      }
    }
  };

  // Fase de dar pistas
  if (currentRound.status === 'waiting_clues') {
    const currentTurnPlayer = alivePlayers.find(p => p.id === currentRound.current_turn_player_id);
    const isMyTurn = currentPlayerId === currentRound.current_turn_player_id;

    return (
      <div className="space-y-6">
        <Card className="p-6 bg-gradient-to-br from-primary/20 to-secondary/20">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">Ronda {currentRound.round_number}</h3>
            <div className="flex items-center justify-center gap-4">
              <p className="text-lg">
                {isImpostor ? (
                  <span className="text-destructive font-bold">¡Eres el IMPOSTOR! 🎭</span>
                ) : (
                  <>
                    <span className="font-bold">Palabra secreta:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowWord(!showWord)}
                      className="ml-2"
                    >
                      {showWord ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </>
                )}
              </p>
            </div>
            {!isImpostor && showWord && (
              <div className="text-3xl font-black text-gradient">
                {currentRound.secret_word}
              </div>
            )}
            {isImpostor && (
              <p className="text-muted-foreground">
                Debes dar una pista general sin conocer la palabra
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-accent/20 to-primary/10">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Turno de:</p>
            <p className="text-2xl font-bold">
              {currentTurnPlayer?.name || "Cargando..."}
              {isMyTurn && " 👈 ¡Tu turno!"}
            </p>
            <p className="text-muted-foreground">
              {clues.length} / {alivePlayers.length} pistas enviadas
            </p>
          </div>
        </Card>

        {!hasSubmittedClue && currentPlayer?.is_alive && isMyTurn ? (
          <Card className="p-6">
            <div className="space-y-4">
              <Label htmlFor="clue">Tu pista</Label>
              <Input
                id="clue"
                type="text"
                placeholder="Escribe algo general relacionado..."
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                className="text-lg"
              />
              <Button
                variant="game"
                className="w-full"
                onClick={handleSubmitClue}
                disabled={!clue.trim()}
              >
                Enviar pista
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-lg">
              {!currentPlayer?.is_alive 
                ? "Estás eliminado"
                : hasSubmittedClue 
                  ? "Pista enviada. Esperando a los demás..."
                  : "Esperando tu turno..."}
            </p>
          </Card>
        )}

        {clues.length > 0 && (
          <Card className="p-6">
            <h4 className="text-xl font-bold mb-4">Pistas enviadas:</h4>
            <div className="space-y-2">
              {clues.map((c) => {
                const player = players.find(p => p.id === c.player_id);
                return (
                  <div
                    key={c.id}
                    className="p-3 bg-background rounded-lg border-2 border-border"
                  >
                    <span className="font-medium">{player?.name}:</span> {c.clue_text}
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Fase de votación
  if (currentRound.status === 'voting') {
    return (
      <div className="space-y-6">
        <Card className="p-6 bg-gradient-to-br from-destructive/20 to-primary/20">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">¡Hora de votar!</h3>
            <p className="text-lg">¿Quién crees que es el impostor?</p>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="text-xl font-bold mb-4">Pistas de todos:</h4>
          <div className="space-y-3">
            {alivePlayers.map((player) => {
              const playerClue = clues.find(c => c.player_id === player.id);
              return (
                <div
                  key={player.id}
                  className="p-4 bg-background rounded-lg border-2 border-border space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{player.name}</span>
                    {!hasVoted && currentPlayer?.is_alive && player.id !== currentPlayerId && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleVote(player.id)}
                      >
                        Votar
                      </Button>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    Pista: {playerClue?.clue_text || "No envió pista"}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        {hasVoted && (
          <Card className="p-6 text-center">
            <p className="text-lg">Voto registrado. Esperando resultados...</p>
            <p className="text-muted-foreground mt-2">
              {votes.length} / {alivePlayers.length} votos
            </p>
          </Card>
        )}
      </div>
    );
  }

  return null;
};

export default GamePhase;
