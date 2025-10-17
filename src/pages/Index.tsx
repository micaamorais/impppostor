import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowToPlaySection from "@/components/HowToPlaySection";
import PlaySection from "@/components/PlaySection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <HowToPlaySection />
        <PlaySection />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
