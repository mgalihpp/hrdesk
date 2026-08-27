import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Benefits from "./components/Benefits";
import FeatureTabs from "./components/FeatureTabs";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Benefits />
      <FeatureTabs />
    </>
  );
}
