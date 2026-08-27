import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Benefits from "./components/Benefits";
import Feature from "./components/Feature";
import UseCases from "./components/UseCases";
import Testimonial from "./components/Testimonial";
import Integration from "./components/Integration";
import Reviews from "./components/Reviews";
import Pricing from "./components/Pricing";
import Faq from "./components/Faq";
import ClientLogos from "./components/ClientLogos";
import FinalCta from "./components/FinalCta";
import Footer from "./components/Footer";
import ScrollReveal from "./components/ScrollReveal";
import WebflowWidgets from "./components/WebflowWidgets";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Benefits />
      <Feature />
      <UseCases />
      <Testimonial />
      <Integration />
      <Reviews />
      <Pricing />
      <Faq />
      <ClientLogos />
      <FinalCta />
      <Footer />
      <ScrollReveal />
      <WebflowWidgets />
    </>
  );
}
