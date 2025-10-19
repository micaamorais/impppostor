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
  status: 'waiting_clues' | 'voting' | 'finished';nm
};

type Clue = {
  id: string;
  player_id: string;
  clue_text: string;
};

// Update Vote type to match DB schema
type Vote = {
  id: string;
  voter_id: string;
  voted_for_id: string;
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
  
  // Add submitting state to prevent duplicate inserts
  const [submittingClue, setSubmittingClue] = useState(false);
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isImpostor = currentPlayer?.role === 'impostor';
  const alivePlayers = players.filter(p => p.is_alive);

  // Estado para almacenar la palabra secreta real desde room
  const [realSecretWord, setRealSecretWord] = useState<string | null>(null);
  const [effectiveRoundId, setEffectiveRoundId] = useState<string | null>(null);
  
  // Fetch the secret word from the room (it's stored there, not in rounds)
  useEffect(() => {
    const fetchSecretWord = async () => {
      if (!roomId) return;
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();
      if (!error && data?.secret_word) {
        setRealSecretWord(data.secret_word);
      }
    };
    fetchSecretWord();
  }, [roomId]);

  // Resolver UUID real de la ronda
  useEffect(() => {
    let cancelled = false;
    const resolveRoundId = async () => {
      if (!currentRound) return;
      try {
        const { data, error } = await supabase
          .from('rounds')
          .select('id')
          .eq('room_id', currentRound.room_id)
          .eq('round_number', currentRound.round_number)
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (!cancelled && data?.id && isUuid(data.id)) {
          setEffectiveRoundId(data.id);
        }
      } catch (err) {
        console.error('resolveRoundId error', err);
      }
    };
    resolveRoundId();
    return () => { cancelled = true; };
  }, [currentRound?.room_id, currentRound?.round_number]);

  // Validar UUID helper
  function isUuid(val: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
  }

  // Deshabilitar acciones si round_id inválido
  const roundIdInvalid = !effectiveRoundId || !isUuid(effectiveRoundId);

  // Reset state when round changes
  useEffect(() => {
    setClues([]);
    setVotes([]);
    setHasSubmittedClue(false);
    setHasVoted(false);
    setClue("");
    setShowWord(false);
    setEffectiveRoundId(null); // Reset round ID to force re-resolution
  }, [currentRound?.id, currentRound?.round_number]);

  // Suscripción y cargas iniciales de pistas usando effectiveRoundId
  useEffect(() => {
    if (roundIdInvalid) return;

    const fetchClues = async () => {
      const { data, error } = await supabase
        .from('clues')
        .select('*')
        .eq('round_id', effectiveRoundId);
      if (!error && data) {
        setClues(data);
        console.log('Fetched clues:', data.length, 'for round', effectiveRoundId);
      }

      // Verificar si el jugador ya envió su pista en ESTA ronda
      if (currentPlayerId) {
        const { data: myClue } = await supabase
          .from('clues')
          .select('id')
          .eq('round_id', effectiveRoundId)
          .eq('player_id', currentPlayerId)
          .limit(1);
        if (myClue && myClue.length > 0) {
          setHasSubmittedClue(true);
          console.log('Player has already submitted clue for round', effectiveRoundId);
        }
      }
    };

    fetchClues();

    const channel = supabase
      .channel(`clues-${effectiveRoundId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clues',
          filter: `round_id=eq.${effectiveRoundId}`,
        },
        (payload) => {
          console.log('New clue received:', payload.new);
          setClues((prev) => [...prev, payload.new as any]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveRoundId, roundIdInvalid, currentPlayerId]);

  // Suscripción y cargas iniciales de votos usando effectiveRoundId
  useEffect(() => {
    if (roundIdInvalid) return;

    const fetchVotes = async () => {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('round_id', effectiveRoundId);
      if (!error && data) {
        setVotes(data);
        console.log('Fetched votes:', data.length, 'for round', effectiveRoundId);
      }

      // Verificar si el jugador ya votó en ESTA ronda
      if (currentPlayerId) {
        const { data: myVote } = await supabase
          .from('votes')
          .select('id')
          .eq('round_id', effectiveRoundId)
          .eq('voter_id', currentPlayerId)
          .limit(1);
        if (myVote && myVote.length > 0) {
          setHasVoted(true);
          console.log('Player has already voted for round', effectiveRoundId);
        }
      }
    };

    fetchVotes();

    const channel = supabase
      .channel(`votes-${effectiveRoundId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
          filter: `round_id=eq.${effectiveRoundId}`,
        },
        (payload) => {
          console.log('New vote received:', payload.new);
          setVotes((prev) => [...prev, payload.new as any]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveRoundId, roundIdInvalid, currentPlayerId]);

  // Eliminado duplicado: los handlers canónicos están más abajo y usan columnas válidas (clue_text, voted_for_id) y validación de UUID.

  // Mostrar loader si round_id inválido
  if (roundIdInvalid) {
    return (
      <div className="text-center p-6 bg-muted rounded-lg">
        <p className="text-lg text-muted-foreground">Cargando ronda real...</p>
      </div>
    );
  }

  // Suscripción de clues consolidada arriba; eliminado duplicado.


  // Suscripción de votes consolidada arriba; eliminado duplicado.

  const handleSubmitClue = async () => {
    if (!clue.trim() || !currentPlayerId || !effectiveRoundId) return;
    if (submittingClue || hasSubmittedClue) return;

    setSubmittingClue(true);

    try {
      // Check if clue already exists for this player in this round
      const { data: existingClue } = await supabase
        .from('clues')
        .select('id')
        .eq('round_id', effectiveRoundId)
        .eq('player_id', currentPlayerId)
        .limit(1);

      if (existingClue && existingClue.length > 0) {
        setHasSubmittedClue(true);
        setClue("");
        toast({ title: "Ya enviaste una pista", description: "Tu pista ya fue registrada." });
        return;
      }

      // Insert the clue
      const { error } = await supabase
        .from('clues')
        .insert({
          round_id: effectiveRoundId,
          player_id: currentPlayerId,
          clue_text: clue.trim(),
        });

      if (error) throw error;

      setHasSubmittedClue(true);
      setClue("");

      // Get updated clues to check if all have submitted
      const { data: allClues } = await supabase
        .from('clues')
        .select('player_id')
        .eq('round_id', effectiveRoundId);

      const clueCount = allClues?.length || 0;
      console.log('Total clues after submission:', clueCount, 'Alive players:', alivePlayers.length);

      if (clueCount >= alivePlayers.length) {
        // All players have submitted, move to voting phase
        console.log('All players have submitted clues, moving to voting phase');
        await supabase
          .from('rounds')
          .update({ status: 'voting' })
          .eq('id', effectiveRoundId);
      }

      toast({ title: "Pista enviada", description: "Tu pista fue registrada." });
    } catch (err: any) {
      console.error("Error enviando pista:", err);
      toast({ title: "Error", description: err.message || "No se pudo enviar la pista" });
    } finally {
      setSubmittingClue(false);
    }
  };

  const handleVote = async (votedPlayerId: string) => {
    if (!currentPlayerId || hasVoted) return;

    try {
      // Check if vote already exists for this player in this round
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('round_id', effectiveRoundId)
        .eq('voter_id', currentPlayerId)
        .limit(1);

      if (existingVote && existingVote.length > 0) {
        setHasVoted(true);
        toast({ title: "Ya votaste", description: "Tu voto ya fue registrado." });
        return;
      }

      const { error } = await supabase
        .from('votes')
        .insert({
          round_id: effectiveRoundId,
          voter_id: currentPlayerId,
          voted_for_id: votedPlayerId
        });

      if (error) throw error;

      setHasVoted(true);
      toast({
        title: "¡Voto registrado!",
        description: "Esperando a los demás lotsos"
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
    if (!effectiveRoundId) return;

    // Obtener votos actualizados desde la base de datos para evitar usar estado potencialmente desfasado
    const { data: allVotes, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .eq('round_id', effectiveRoundId);

    if (votesError) {
      toast({ title: "Error", description: votesError.message || "No se pudieron leer votos" });
      return;
    }
    if (!allVotes) return;

    try {
      const votesCount: Record<string, number> = {};
      allVotes.forEach(v => {
        votesCount[v.voted_for_id] = (votesCount[v.voted_for_id] || 0) + 1;
      });

      const sortedVotes = Object.entries(votesCount).sort((a, b) => b[1] - a[1]);
      const mostVotedPlayerId = sortedVotes[0]?.[0];

      if (mostVotedPlayerId) {
        await supabase
          .from('players')
          .update({ is_alive: false })
          .eq('id', mostVotedPlayerId);
      }

      await supabase
        .from('rounds')
        .update({ status: 'finished' })
        .eq('id', effectiveRoundId);

      const alivePlayersCount = alivePlayers.filter(p => p.id !== mostVotedPlayerId).length;
      const impostorAlive = players.some(p => p.role === 'impostor' && p.is_alive && p.id !== mostVotedPlayerId);

      let nextStatus: 'waiting_clues' | 'voting' | 'finished' = 'finished';
      if (impostorAlive && alivePlayersCount > 2) {
        nextStatus = 'waiting_clues';
      }

      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (!roomData) return;

      if (nextStatus === 'waiting_clues') {
        const nextRoundNumber = (currentRound.round_number || 1) + 1;
        // No cambiar la palabra, sigue siendo la misma en room.secret_word
        await supabase
          .from('rounds')
          .insert({
            room_id: roomId,
            round_number: nextRoundNumber,
            status: 'waiting_clues',
            secret_word: realSecretWord
          });
      } else {
        await supabase
          .from('rooms')
          .update({ status: 'finished' })
          .eq('id', roomId);
      }

      toast({ title: "Resultado de la ronda calculado" });
    } catch (err: any) {
      console.error("Error calculando resultado:", err);
      toast({ title: "Error", description: err.message || "No se pudo calcular el resultado" });
    }
  };

  // Fase de dar pistas - todos pueden enviar simultáneamente
  if (currentRound.status === 'waiting_clues') {

    return (
      <div className="space-y-6">
        <Card className="p-6 bg-gradient-to-br from-primary/20 to-secondary/20">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">Ronda {currentRound.round_number}</h3>
            <div className="flex items-center justify-center gap-4">
              <p className="text-lg">
                {isImpostor ? (
                  <span className="text-destructive font-bold">¡Eres el PREPUSTOR! 🎭</span>
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
            {!isImpostor && !showWord && (
              <p className="text-sm text-muted-foreground">Pulsa el ojo para revelar la palabra.</p>
            )}
            {!isImpostor && showWord && (
              <div className="text-3xl font-black text-gradient">
                {realSecretWord}
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
            <p className="text-muted-foreground">
              {clues.length} / {alivePlayers.length} pistas enviadas
            </p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-muted-foreground">
                Round ID: {effectiveRoundId?.substring(0, 8)}...
              </p>
            )}
          </div>
        </Card>

        {!hasSubmittedClue && currentPlayer?.is_alive ? (
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
                disabled={!clue.trim() || submittingClue}
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
            <p className="text-lg">¿Quién crees que es el prepustor?</p>
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
