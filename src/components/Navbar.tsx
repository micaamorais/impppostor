import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b border-border z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gradient">PREPUSTOR</h1>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection("inicio")}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Inicio
            </button>
            <button
              onClick={() => scrollToSection("como-jugar")}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Cómo jugar
            </button>
            <button
              onClick={() => scrollToSection("jugar")}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Jugar
            </button>
            <button
              onClick={() => scrollToSection("acerca")}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Acerca de
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4 animate-in slide-in-from-top">
            <button
              onClick={() => scrollToSection("inicio")}
              className="block w-full text-left text-foreground hover:text-primary transition-colors font-medium py-2"
            >
              Inicio
            </button>
            <button
              onClick={() => scrollToSection("como-jugar")}
              className="block w-full text-left text-foreground hover:text-primary transition-colors font-medium py-2"
            >
              Cómo jugar
            </button>
            <button
              onClick={() => scrollToSection("jugar")}
              className="block w-full text-left text-foreground hover:text-primary transition-colors font-medium py-2"
            >
              Jugar
            </button>
            <button
              onClick={() => scrollToSection("acerca")}
              className="block w-full text-left text-foreground hover:text-primary transition-colors font-medium py-2"
            >
              Acerca de
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
