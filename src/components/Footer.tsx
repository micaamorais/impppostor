import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border py-8 px-4">
      <div className="container mx-auto text-center">
        <p className="text-muted-foreground flex items-center justify-center gap-2">
          © 2025 Impostor Game — Creado con <Heart className="w-5 h-5 text-primary fill-primary animate-pulse" /> para jugadores que sospechan de todo
        </p>
      </div>
    </footer>
  );
};

export default Footer;
