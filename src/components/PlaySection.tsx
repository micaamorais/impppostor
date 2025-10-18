import { useState } from "react";
import { Plus, Key, Users, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useGameRoom } from "@/hooks/useGameRoom";

const PlaySection = () => {
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [impostorCount, setImpostorCount] = useState(1);
  const [maxRounds, setMaxRounds] = useState(5);
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { room, players, loading, createRoom, joinRoom, startGame } = useGameRoom(createdRoomCode || undefined);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      toast({
        title: "Error",
        description: "Ingresa tu nombre primero",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const code = await createRoom(maxPlayers, impostorCount, maxRounds);
      // Unirse automáticamente como host
      await joinRoom(code, playerName);
      setCreatedRoomCode(code);
      setShowCreateRoom(false);
      toast({
        title: "¡Sala creada! 🎉",
        description: `Código: ${code} - Comparte el código con tus amigos`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear la sala",
        variant: "destructive",
      });
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !joinCode.trim()) {
      toast({
        title: "Error",
        description: "Completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    try {
      await joinRoom(joinCode, playerName);
      toast({
        title: "¡Conectado! 🎮",
        description: `Te uniste a la sala ${joinCode}`,
      });
      setShowJoinRoom(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo unir a la sala",
        variant: "destructive",
      });
    }
  };

  const handleStartGame = async () => {
    if (!room) return;
    
    try {
      await startGame(room.id);
      toast({
        title: "¡Juego iniciado! 🎯",
        description: "Buena suerte detectando al impostor",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo iniciar el juego",
        variant: "destructive",
      });
    }
  };

  const copyRoomCode = () => {
    if (createdRoomCode) {
      navigator.clipboard.writeText(createdRoomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "¡Copiado!",
        description: "Código copiado al portapapeles",
      });
    }
  };

  // Si hay una sala activa, mostrar el lobby
  if (room) {
    return (
      <section id="jugar" className="py-20 px-4 bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto max-w-4xl">
          <Card className="p-8 bg-card border-2 border-primary">
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-gradient">
                  Sala {room.code}
                </h2>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyRoomCode}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar código
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Users className="w-5 h-5" />
                  <span className="text-lg">
                    {players.length} / {room.max_players} jugadores
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-bold">Jugadores en la sala:</h3>
                <div className="grid gap-2">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-background rounded-lg border-2 border-border"
                    >
                      <span className="font-medium">{player.name}</span>
                      {player.is_host && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          Anfitrión
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {room.status === 'waiting' && players.some(p => p.is_host) && (
                <Button
                  variant="game"
                  size="lg"
                  className="w-full"
                  onClick={handleStartGame}
                  disabled={loading || players.length < 4}
                >
                  {players.length < 4
                    ? `Esperando jugadores (min. 4)`
                    : '🎮 Iniciar juego'}
                </Button>
              )}

              {room.status === 'playing' && (
                <div className="text-center p-6 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg">
                  <p className="text-2xl font-bold">¡Juego en curso!</p>
                  <p className="text-muted-foreground mt-2">
                    Ronda {room.current_round} de {room.max_rounds}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="jugar" className="py-20 px-4 bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-5xl md:text-6xl font-black text-gradient">
            ¡Es hora de jugar!
          </h2>
          <p className="text-xl text-muted-foreground">
            Crea una sala o únete a una existente
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create Room */}
          <Card className="p-8 bg-card border-2 border-border hover:border-primary transition-all duration-300 hover-lift">
            <div className="space-y-6">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-2xl mx-auto glow-primary">
                <Plus className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-3xl font-bold text-center">Crear sala</h3>
              <p className="text-muted-foreground text-center">
                Configura tu partida y comparte el código con amigos
              </p>
              
              {showCreateRoom ? (
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="createPlayerName">Tu nombre</Label>
                    <Input 
                      id="createPlayerName" 
                      type="text" 
                      placeholder="Tu nombre"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="bg-background border-2"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="players">Número de jugadores (4-10)</Label>
                    <Input 
                      id="players" 
                      type="number" 
                      min="4" 
                      max="10" 
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                      className="bg-background border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="impostors">Número de impostores</Label>
                    <Input 
                      id="impostors" 
                      type="number" 
                      min="1" 
                      max="3" 
                      value={impostorCount}
                      onChange={(e) => setImpostorCount(parseInt(e.target.value))}
                      className="bg-background border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rounds">Rondas</Label>
                    <Input 
                      id="rounds" 
                      type="number" 
                      min="3" 
                      max="10" 
                      value={maxRounds}
                      onChange={(e) => setMaxRounds(parseInt(e.target.value))}
                      className="bg-background border-2"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="submit" 
                      variant="hero" 
                      className="flex-1"
                      disabled={loading}
                    >
                      {loading ? 'Creando...' : 'Crear ahora'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setShowCreateRoom(false)}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <Button 
                  variant="game" 
                  size="lg" 
                  className="w-full"
                  onClick={() => setShowCreateRoom(true)}
                >
                  <Plus className="mr-2" />
                  Crear sala
                </Button>
              )}
            </div>
          </Card>

          {/* Join Room */}
          <Card className="p-8 bg-card border-2 border-border hover:border-secondary transition-all duration-300 hover-lift">
            <div className="space-y-6">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary to-secondary-glow rounded-2xl mx-auto glow-secondary">
                <Key className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="text-3xl font-bold text-center">Unirse a sala</h3>
              <p className="text-muted-foreground text-center">
                Ingresa el código de la sala para jugar con tus amigos
              </p>
              
              {showJoinRoom ? (
                <form onSubmit={handleJoinRoom} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="playerName">Tu nombre</Label>
                    <Input 
                      id="playerName" 
                      type="text" 
                      placeholder="Jugador misterioso"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="bg-background border-2"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roomCode">Código de sala</Label>
                    <Input 
                      id="roomCode" 
                      type="text" 
                      placeholder="ABC123"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="bg-background border-2 text-center text-2xl tracking-wider font-bold"
                      maxLength={6}
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="submit" 
                      variant="hero" 
                      className="flex-1"
                      disabled={loading}
                    >
                      {loading ? 'Conectando...' : 'Unirse'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setShowJoinRoom(false)}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <Button 
                  variant="game" 
                  size="lg" 
                  className="w-full"
                  onClick={() => setShowJoinRoom(true)}
                >
                  <Key className="mr-2" />
                  Unirse a sala
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PlaySection;
