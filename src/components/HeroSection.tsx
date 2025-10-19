import { Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-impostor.jpg";

const HeroSection = () => {
  const scrollToPlay = () => {
    const element = document.getElementById("jugar");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="inicio" className="min-h-screen flex items-center justify-center pt-16 px-4">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left space-y-6 animate-fade-in">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-gradient leading-tight animate-title">
              PREPUSTOR
            </h1>
            <p className="text-2xl md:text-3xl text-muted-foreground font-medium">
              Un juego para una familita inseparable
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Todos reciben una palabra secreta... excepto el prepustor. ¿Quién miente mejor? 
              Cada palabra puede traicionarte.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Button 
                variant="hero" 
                size="lg"
                onClick={scrollToPlay}
                className="group"
              >
                <Gamepad2 className="mr-2 group-hover:rotate-12 transition-transform" />
                Jugar ahora
              </Button>
              <Button 
                variant="game" 
                size="lg"
                onClick={() => {
                  const element = document.getElementById("como-jugar");
                  if (element) element.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Ver reglas
              </Button>
            </div>
          </div>
          
          <div className="relative animate-float">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
            <img 
              src={heroImage} 
              alt="Jugadores sospechosos señalándose entre sí" 
              className="relative rounded-3xl shadow-2xl glow-primary"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
