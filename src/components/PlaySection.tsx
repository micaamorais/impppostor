import { useState } from "react";
import { Plus, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const PlaySection = () => {
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const { toast } = useToast();

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "¡Sala creada! 🎉",
      description: "Comparte el código con tus amigos para jugar",
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Uniéndote a la sala...",
      description: "Preparando el juego",
    });
  };

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
                    <Label htmlFor="players">Número de jugadores</Label>
                    <Input 
                      id="players" 
                      type="number" 
                      min="3" 
                      max="12" 
                      defaultValue="6"
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
                      defaultValue="1"
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
                      defaultValue="5"
                      className="bg-background border-2"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="submit" variant="hero" className="flex-1">
                      Crear ahora
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setShowCreateRoom(false)}
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
                      className="bg-background border-2 text-center text-2xl tracking-wider font-bold"
                      maxLength={6}
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="submit" variant="hero" className="flex-1">
                      Unirse
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setShowJoinRoom(false)}
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
