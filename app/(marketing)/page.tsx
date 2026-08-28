import Benefits from "../components/Benefits";
import ClientLogos from "../components/ClientLogos";
import Faq from "../components/Faq";
import Feature from "../components/Feature";
import FinalCta from "../components/FinalCta";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import Integration from "../components/Integration";
import Navbar from "../components/Navbar";
import Pricing from "../components/Pricing";
import Reviews from "../components/Reviews";
import ScrollReveal from "../components/ScrollReveal";
import Testimonial from "../components/Testimonial";
import UseCases from "../components/UseCases";
import WebflowWidgets from "../components/WebflowWidgets";
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
