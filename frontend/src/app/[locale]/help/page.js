import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HelpHero from './components/HelpHero';
import HelpCategories from './components/HelpCategories';
import FAQSection from './components/FAQSection';

export const metadata = {
  title: 'Help Center | AirbCar',
  description: 'Find answers to your questions about AirbCar services, bookings, and more.',
};

export default function HelpCenterPage() {
  return (
    <div className="bg-[#0f1115] min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <HelpHero />
        <HelpCategories />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
