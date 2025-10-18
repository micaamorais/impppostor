import { Heart, Users, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

const AboutSection = () => {
  return (
    <section id="acerca" className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-5xl md:text-6xl font-black text-gradient">
            Acerca del juego
          </h2>
          <p className="text-xl text-muted-foreground">
            La historia detrás de PREPUSTOR
          </p>
        </div>

        <Card className="p-8 md:p-12 bg-card border-2 border-border space-y-8">
          <div className="space-y-4">
            <p className="text-lg text-foreground leading-relaxed">
              <span className="text-1xl font-bold text-primary">Prepustor</span> nació entre una familita 
              que quería un juego rápido y divertido para descubrir quién miente mejor. 
              La idea es simple: crear un momento de risas en los chupistreams.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              En cada partida, las palabras se convierten en pistas, las pistas en sospechas, 
              y las sospechas en acusaciones. ¿Vas a poder sobrevivir a los lotsos?
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-8">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-2xl mx-auto">
                <Heart className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold">Hecho con cariño</h3>
              <p className="text-sm text-muted-foreground">
                Creado por lotsos, para lotsos
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary to-secondary-glow rounded-2xl mx-auto">
                <Users className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-bold">Para todos</h3>
              <p className="text-sm text-muted-foreground">
                Fácil de jugar, difícil de ganar
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent to-secondary rounded-2xl mx-auto">
                <Zap className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-bold">Partidas rápidas</h3>
              <p className="text-sm text-muted-foreground">
                Diversión en cada ronda
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-border">
            <p className="text-center text-muted-foreground">
              ¿Sugerencias? Escribí a moraamz (discord) o a{" "}
              <a href="mailto:m.morais7372@gmail.com" className="text-primary hover:text-primary-glow transition-colors font-semibold">
                m.morais7372@gmail.com
              </a>
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default AboutSection;
