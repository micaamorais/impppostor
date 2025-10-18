import { Card } from "@/components/ui/card";
import iconWord from "@/assets/icon-word.png";
import iconClues from "@/assets/icon-clues.png";
import iconVote from "@/assets/icon-vote.png";
import iconWin from "@/assets/icon-win.png";

const HowToPlaySection = () => {
  const steps = [
    {
      icon: iconWord,
      title: "Recibí tu palabra",
      description: "Todos los lostos reciben una palabra secreta... menos el prepustor, que no la conoce.",
      color: "from-primary to-primary-glow"
    },
    {
      icon: iconClues,
      title: "Dá pistas generales",
      description: "Cada losto dice algo relacionado con la palabra. El prepustor improvisa para disimular.",
      color: "from-secondary to-secondary-glow"
    },
    {
      icon: iconVote,
      title: "Vota al sospechoso",
      description: "Todos votan quién creen que es el prepustor basándose en las pistas que se dieron.",
      color: "from-accent to-secondary"
    },
    {
      icon: iconWin,
      title: "Ganadores",
      description: "Si eliminan al prepustor, gana la familita. Si no, gana él. ¡Cada palabra importa!",
      color: "from-primary to-accent"
    }
  ];

  return (
    <section id="como-jugar" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-5xl md:text-6xl font-black text-gradient">
            ¿Cómo se juega?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Aprender es tan simple como mentir... o intentarlo
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Card 
              key={index}
              className="p-6 bg-card border-2 border-border hover:border-primary transition-all duration-300 hover-lift group"
            >
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-24 h-24 mb-4">
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity`}></div>
                  <div className={`relative bg-gradient-to-br ${step.color} rounded-2xl p-4 flex items-center justify-center`}>
                    <img 
                      src={step.icon} 
                      alt={step.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-block bg-card border-2 border-accent rounded-2xl px-8 py-4 glow-accent">
            <p className="text-2xl font-bold text-accent">
              💡 Cada palabra traiciona
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowToPlaySection;
