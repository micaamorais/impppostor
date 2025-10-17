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
            La historia detrás de IMPOSTOR
          </p>
        </div>

        <Card className="p-8 md:p-12 bg-card border-2 border-border space-y-8">
          <div className="space-y-4">
            <p className="text-lg text-foreground leading-relaxed">
              <span className="text-2xl font-bold text-primary">Impostor</span> nació entre amigos 
              que querían un juego rápido y divertido para descubrir quién miente mejor. 
              La idea era simple: crear un momento de risas, tensión y deducción social sin complicaciones.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              En cada partida, las palabras se convierten en pistas, las pistas en sospechas, 
              y las sospechas en acusaciones. ¿Podrás mantener tu secreto o serás descubierto?
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-8">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-2xl mx-auto">
                <Heart className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold">Hecho con pasión</h3>
              <p className="text-sm text-muted-foreground">
                Creado por jugadores, para jugadores
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary to-secondary-glow rounded-2xl mx-auto">
                <Users className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-bold">Para todos</h3>
              <p className="text-sm text-muted-foreground">
                Fácil de aprender, difícil de dominar
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent to-secondary rounded-2xl mx-auto">
                <Zap className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-bold">Partidas rápidas</h3>
              <p className="text-sm text-muted-foreground">
                Diversión instantánea en cada ronda
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-border">
            <p className="text-center text-muted-foreground">
              ¿Tienes preguntas o sugerencias? Escríbenos a{" "}
              <a href="mailto:hola@impostorgame.com" className="text-primary hover:text-primary-glow transition-colors font-semibold">
                hola@impostorgame.com
              </a>
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default AboutSection;
