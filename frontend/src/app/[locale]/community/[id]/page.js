'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Heart, Share2, ThumbsUp, BadgeCheck, Car, 
  Mountain, Umbrella, Moon, ShieldCheck, Search, Users, Map, Menu
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function CommunityThreadPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();

  return (
    <div className="bg-background text-foreground selection:bg-kc-primary-container selection:text-kc-on-primary-container min-h-screen pb-24 md:pb-0">
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-8 py-10">
        
        {/* Breadcrumb & Back */}
        <button 
          onClick={() => router.back()} 
          className="mb-8 flex items-center gap-2 text-kc-on-surface-variant opacity-70 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-bold tracking-widest uppercase">Back to Community</span>
        </button>

        {/* Thread Header */}
        <header className="mb-12 max-w-4xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-kc-on-surface mb-6 leading-tight">
            Exploring the Atlas Mountains in a 911
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex -space-x-3 shrink-0">
              <img 
                alt="User 1" 
                className="w-10 h-10 rounded-full border-2 border-background object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBa1l-Sv7O_3pSPKp_nGkngIdpnc8HrCQkHjfMOLYkiyqBtnhAqcu2RPHcvjP4mDNXico2WRBNfnZX1-9awliYxMgfD000JbR8y63kXI5yQxvMDYrIzZso9Hu48Dew_Hd2SKreREKGQqFzz4GhnIMlWzXgKY1gQTSCdfzAiUyf9aH-SzK6Pd6qBBsJCVVW-vAiRqkezwRzhj3rsCsUFW9RPuPV7oaR4gV9OpTXEHSEiibnyKXQClL8cvOFSdcM6-vVmiZ9zjViVKKI"
              />
              <img 
                alt="User 2" 
                className="w-10 h-10 rounded-full border-2 border-background object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAicIRc5uWW2-tsB5rwXSbRd3vipg00_dhbgLRM1L9IQwmYfgmHVO6yokK5gr3_awqtssS8L01GMZOprT_vzWADhxK8vSdKEMWYaMvYWdjATulAxgTCr3S9t7sb_N3moDD6IbRiP5uYCqvcZNslxMNW1fim3pQX0r1RVt6CYsv_FKsYeOwBD82QHu7tvwlpGNBa2g19RLMb7srkP5lgjFLVU3kiGGEU3W6phLXHVGqyTzIJm8w_vuJ18v51cea-yFkBHkUSNShuP_A"
              />
              <div className="w-10 h-10 rounded-full border-2 border-background bg-kc-secondary-container flex items-center justify-center text-[10px] font-bold text-kc-on-secondary-container">
                +14
              </div>
            </div>
            <div className="h-8 w-px bg-kc-outline-variant/30 hidden sm:block mx-1" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-kc-on-surface">Omar Al-Fassi</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-kc-primary">Pro Explorer</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Left: Thread Content */}
          <section className="space-y-12">
            {/* Main Post Card */}
            <div className="bg-kc-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-[0_32px_64px_rgba(18,28,42,0.04)]">
              <div className="prose prose-slate max-w-none mb-10">
                <p className="text-lg leading-relaxed text-kc-on-surface-variant">
                  Last week, I decided to take the <span className="font-bold text-kc-on-surface underline decoration-kc-primary-container decoration-4">911 Carrera 4S</span> from Marrakech Elite up into the Tizi n'Tichka pass. While most would suggest a Cayenne for these routes, the precision of the 911 on these hairpin turns is something every enthusiast needs to experience. The tarmac is surprisingly well-maintained, but watch out for the occasional goat crossing near Telouet.
                </p>
              </div>

              {/* Photo Bento Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-auto sm:h-[500px] mb-10">
                <div className="rounded-2xl overflow-hidden relative group h-[300px] sm:h-auto">
                  <img 
                    alt="Porsche in Atlas" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPvOxRq3-8HoOnl6gislgA48fp4GVo68F9bFPAEP9sm-fGxWEEW-dRyAOHf4xahJfInjpwepQTvBdfnG9rLwQNw3vCJX6CBuZl-ge6Fh0hkxml1XUSHp_sIN_fIG8AnKVldR3pnpir4ZqxZfLzss8eC8aS1D9aPeruPW0bhcmISSgF-ZAiWBDyoVOagIDeDNxsJswppBoXSZMc3nl7mdmHd5MxUCMSeSJts-5xXms6lCLkhqkyzyoHZ_spia0secMQFGTTKo98x_w"
                  />
                </div>
                <div className="grid grid-rows-2 gap-4 h-[400px] sm:h-auto">
                  <div className="rounded-2xl overflow-hidden">
                    <img 
                      alt="Atlas Mountains" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHEhCqlOTa3XWgFFpP8UEy92VUrEePDD6StTymHYhqRPiQO81KtDwWJAJcOMu6UtaHz-Aqi1_jAaVm3C-_cQTYHWI0hg_VF4b1-FPG93R-NIUh70-iXf0RQwAS0RhLrqmZrbL8hzEbac-krC8h1wq4co7HPsQ9-79_6uu4aUR3qlry0CLXmW7IIvBT1jTxALtmGkTe4thXTwOv8LYbLmQoMwA_kbF2vCW9DicgaOTIefJpUYguA5AkNWIhriC5uq7HwOqC0oSxNYA"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden relative">
                    <img 
                      alt="Interior View" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEtdC1U5DTu3PIltAnigIzrPYGJKQielTh12EIpeq1GzX3h3_LEZGuiHjfHGTaTRiB4mmgXcFxdR3cJA0yOzYxs-iisfyUAF5fw-UEwJwlLKsgRoq0Rf4pI88R0Gc2Pwup_JwVP6ku7rOHVPc6NrfdnQykiJkfBzwp_rLJcaJ4tf0-xs5PXx-Cg3tXvO-bvOlNCRjrlkEjQAu7IPKxGSe1iFWBMh922bc2J-OQ504_11rs7NW2TWYQHaJaJLGERlpg7P1AtT4NnwE"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">     
                      <span className="text-white font-bold">+5 Photos</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reactions */}
              <div className="flex flex-wrap items-center gap-3">
                <button className="bg-kc-secondary-container text-kc-on-secondary-container px-4 py-2 rounded-full flex items-center gap-2 hover:bg-kc-primary-container hover:text-white transition-colors">
                  <Heart className="w-5 h-5 fill-current" />
                  <span className="text-sm font-bold">124</span>
                </button>
                <button className="bg-kc-surface-container text-kc-on-secondary-container px-4 py-2 rounded-full flex items-center gap-2 hover:opacity-80 transition-colors">
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm font-bold">Share</span>
                </button>
                <div className="flex-grow" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-kc-on-surface-variant opacity-50 whitespace-nowrap">
                  Posted 4h ago
                </span>
              </div>
            </div>

            {/* Interactive Comment Section */}
            <div className="space-y-8">
              <h3 className="text-2xl font-bold tracking-tight px-2 text-kc-on-surface">Discussion (24)</h3>
              
              {/* Comment Input */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6 bg-kc-surface-container-low rounded-2xl">
                <div className="hidden sm:block h-10 w-10 rounded-full bg-slate-300 shrink-0 overflow-hidden border border-kc-outline-variant/30">      
                  <img 
                    alt="User" 
                    className="w-full h-full object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3jf3TU_6ajbPqe0aqUySAE6UYft0QD6xp3HNX46WVZUbVIBERMYUNwF66JAVicMJKW5YsplEjRKkC_K3EeExDP5ktc5tz5w2lwgbKdR-Pf64NxoVQaLxKtvw8MPW72X3yc4BCfAon3hTnwXYoZu4qrW1PhyGXB21eXJOQYbxPx_yCQBTOoqKFtsy6-pDD4ps5nGg5nWKh_gKiONAsDJ-v6SPVEzooM9-E3G6MNeAkmynWKkL-e7rsCFPE6MdzvWW-bt6QNuNa8tc"
                  />
                </div>
                <div className="flex-grow space-y-4">
                  <textarea 
                    className="w-full bg-kc-surface-container-lowest border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-kc-primary-container/40 outline-none transition-all min-h-[100px] resize-none text-kc-on-surface placeholder:text-kc-on-surface-variant/50" 
                    placeholder="Share your experience or ask about the route..."
                  />
                  <div className="flex justify-end">
                    <button className="bg-gradient-to-br from-kc-primary to-kc-primary-container text-white px-6 py-2 rounded-xl text-sm font-bold shadow-sm hover:opacity-90 transition-opacity">
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>

              {/* Threaded Comments */}
              <div className="space-y-6">
                
                {/* Comment 1 */}
                <div className="flex gap-3 sm:gap-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-slate-200 shrink-0 overflow-hidden ring-4 ring-background">
                    <img 
                      alt="User" 
                      className="w-full h-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYutNUi0lPHmcRSXahXUYh-fYKG_0vXUrdnxQefcS_8MbL70JLedl3sJ1fZen-JIQMR2xtbTeIJ64pgzq1A9A7-srH1cbybOsj1FqrvCnw9QQMkc9gMk1xKzoibeQjWTExlrB78vNsBmXmvpHqmtQmhAkGa5lOKhhLQ19cXKHFPB-BKul422P5B7joDJyyXNpjmrFPLQ_b0c0czFyxi7FD4aQfGku0cjNLFYY1bLGcpBeCDZI5at-AY4g6IJa2Jl7hM5Fq6CAF2vk"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="bg-kc-surface-container-lowest p-5 sm:p-6 rounded-2xl rounded-tl-none shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-kc-on-surface">Karim J.</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-kc-tertiary-container/10 text-kc-tertiary rounded">Verified Driver</span>
                      </div>
                      <p className="text-sm text-kc-on-surface-variant leading-relaxed">
                        Did you have any issues with the ground clearance near the construction zones before Ouarzazate? I'm planning to take a DB11 next month.
                      </p>
                      <div className="mt-4 flex items-center gap-4">
                        <button className="text-[10px] font-black uppercase tracking-widest text-kc-primary hover:opacity-80 transition-opacity">Reply</button>
                        <button className="flex items-center gap-1 text-[10px] font-bold text-kc-on-surface-variant opacity-60 hover:opacity-100 transition-opacity">
                          <ThumbsUp className="w-3 h-3" /> 12
                        </button>
                      </div>
                    </div>

                    {/* Nested Reply (Agency) */}
                    <div className="mt-4 ml-4 sm:ml-8 flex gap-3 sm:gap-4">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-slate-900 shrink-0 flex items-center justify-center border-2 border-kc-primary-container overflow-hidden">
                        <img 
                          alt="Marrakech Elite" 
                          className="w-full h-full object-cover" 
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCuCzu67O6H0_Tq4QH8eycfxrK7rxzJCb7vZ32u3xIw3Uu_1zH_14w_8pZnsCX6sSafYR2AgeMUdJOpxEQe_w71l_zxIc7yjHCK5dff8bjATgEBPt5jUlnKt3sHbD-eDoPfLWcpI23IKI2grQYrNoAhU9iPI5BCBklYvFOZM99dwzckippGQETR3b5tH2Wwq3tZgjECfgeeKhaP_Q7i09VLekKdbI_KpvNQ7ErORLLuWV58X8F3AZlC9FveDdHYeWQoz1Hjo43vDEI"
                        />   
                      </div>
                      <div className="flex-grow bg-kc-surface-container-low p-4 sm:p-5 rounded-2xl rounded-tl-none">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                          <span className="text-sm font-bold text-kc-on-surface">Marrakech Elite</span>
                          <BadgeCheck className="w-4 h-4 text-kc-primary fill-kc-primary/20" />
                          <span className="text-[10px] font-bold text-kc-primary-container">Agency</span>        
                        </div>
                        <p className="text-sm text-kc-on-surface-variant">
                          @Karim J. The DB11 should be fine! We've just updated our route maps to include the smooth bypass. Feel free to message us for the specific GPS coordinates!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comment 2 */}
                <div className="flex gap-3 sm:gap-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-slate-200 shrink-0 overflow-hidden ring-4 ring-background">
                    <img 
                      alt="User" 
                      className="w-full h-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHPauSC7TezZdLt1XAbN3RtbKyt_-jhik4Tt8PYAJYDsr9-hKzgMWLePpXmjplQE90a9LmaPmL6SG4EOgMpt3t-1tLvSUTo7sV7sH0d7IPnYYKTADk9i5Yn6pQo_LdgKeiR7mMNTqSVyn1_PUhr7F_CdsU1xC695QlcOSM4iS_LM0JMm4fXD44STUe9ad7_aMfY5lwdRb372D77dEQVi0LssqqqmSjZd4X1safbZ6ENZRdv56YfTvOlaSQNZdC08X9zzErk34k1cw"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="bg-kc-surface-container-lowest p-5 sm:p-6 rounded-2xl rounded-tl-none shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-kc-on-surface">Sarah Miller</span>
                      </div>
                      <p className="text-sm text-kc-on-surface-variant leading-relaxed">
                        Absolutely stunning shots! The contrast between the silver paint and the red rock of the mountains is perfect. Adding this to my bucket list for my trip in October.
                      </p>
                      <div className="mt-4 flex items-center gap-4">
                        <button className="text-[10px] font-black uppercase tracking-widest text-kc-primary hover:opacity-80 transition-opacity">Reply</button>
                        <button className="flex items-center gap-1 text-[10px] font-bold text-kc-on-surface-variant opacity-60 hover:opacity-100 transition-opacity">
                          <ThumbsUp className="w-3 h-3" /> 4
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* Right Sidebar */}
          <aside className="space-y-8">
            {/* Agency Spotlight Card */}
            <div className="bg-gradient-to-br from-kc-inverse-surface to-slate-900 text-white rounded-3xl p-8 overflow-hidden relative shadow-lg">
              <div className="relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-kc-primary-container mb-4 block opacity-90">Fleet Partner</span>
                <h4 className="text-2xl font-bold mb-2">Marrakech Elite</h4>
                <p className="text-sm text-slate-300 mb-6 leading-relaxed">Specializing in mountain-ready luxury. 24/7 concierge support for Atlas expeditions.</p>
                <button className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold text-sm hover:bg-kc-primary-container hover:text-white transition-all shadow-sm">
                  View Fleet
                </button> 
              </div>
              <Car className="absolute -bottom-4 -right-4 w-40 h-40 opacity-10 rotate-12" />
            </div>

            {/* Trending Topics */}
            <div className="bg-kc-surface-container-lowest rounded-3xl p-8 shadow-sm">
              <h4 className="text-lg font-bold mb-6 text-kc-on-surface">Trending Routes</h4>
              <div className="space-y-6">
                <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="h-12 w-12 rounded-xl bg-kc-surface-container-high flex items-center justify-center shrink-0 transition-colors group-hover:bg-kc-primary-container/10">
                    <Mountain className="w-6 h-6 text-kc-primary" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold group-hover:text-kc-primary transition-colors text-kc-on-surface">Dades Gorges Loop</h5>
                    <p className="text-[10px] text-kc-on-surface-variant opacity-60 uppercase font-bold tracking-widest">128 active discussions</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="h-12 w-12 rounded-xl bg-kc-surface-container-high flex items-center justify-center shrink-0 transition-colors group-hover:bg-kc-primary-container/10">
                    <Umbrella className="w-6 h-6 text-kc-primary" />        
                  </div>
                  <div>
                    <h5 className="text-sm font-bold group-hover:text-kc-primary transition-colors text-kc-on-surface">Coastal Run: Essaouira</h5>
                    <p className="text-[10px] text-kc-on-surface-variant opacity-60 uppercase font-bold tracking-widest">84 active discussions</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="h-12 w-12 rounded-xl bg-kc-surface-container-high flex items-center justify-center shrink-0 transition-colors group-hover:bg-kc-primary-container/10">
                    <Moon className="w-6 h-6 text-kc-primary" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold group-hover:text-kc-primary transition-colors text-kc-on-surface">Agafay Desert Night</h5>
                    <p className="text-[10px] text-kc-on-surface-variant opacity-60 uppercase font-bold tracking-widest">215 active discussions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Guidelines Card */}
            <div className="bg-kc-surface-container-low rounded-3xl p-8">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-kc-tertiary" />
                <h4 className="text-sm font-bold uppercase tracking-widest text-kc-on-surface">Community Code</h4>     
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="text-kc-primary font-bold text-xs mt-0.5">01</span>
                  <p className="text-xs text-kc-on-surface-variant leading-relaxed">Verified reviews only. Respect the road and local laws.</p>
                </li>
                <li className="flex gap-3">
                  <span className="text-kc-primary font-bold text-xs mt-0.5">02</span>
                  <p className="text-xs text-kc-on-surface-variant leading-relaxed">No aggressive promotional content from non-agency accounts.</p>
                </li>
                <li className="flex gap-3">
                  <span className="text-kc-primary font-bold text-xs mt-0.5">03</span>
                  <p className="text-xs text-kc-on-surface-variant leading-relaxed">Keep it professional. We are a community of enthusiasts.</p>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      {/* BottomNavBar (Mobile only) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-6 pb-8 pt-4 bg-background/90 backdrop-blur-lg rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-50 border-t border-kc-outline-variant/10">
        <Link href={`/${params.locale}/explore`} className="flex flex-col items-center justify-center text-kc-on-surface-variant opacity-60 hover:opacity-100 transition-opacity">
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter mt-1">Explore</span>
        </Link>
        <Link href={`/${params.locale}/community`} className="flex flex-col items-center justify-center text-kc-primary scale-110 transition-transform">
          <Users className="w-6 h-6 fill-current" />
          <span className="text-[10px] font-bold uppercase tracking-tighter mt-1">Social</span>
        </Link>
        <Link href={`/${params.locale}/trips`} className="flex flex-col items-center justify-center text-kc-on-surface-variant opacity-60 hover:opacity-100 transition-opacity">
          <Map className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter mt-1">My Trips</span>
        </Link>
        <button className="flex flex-col items-center justify-center text-kc-on-surface-variant opacity-60 hover:opacity-100 transition-opacity">
          <Menu className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter mt-1">Menu</span> 
        </button>
      </div>
    </div>
  );
}