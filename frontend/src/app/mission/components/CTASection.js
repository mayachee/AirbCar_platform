'use client';

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-orange-400 to-orange-600 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="text-center lg:text-left">
            <div className="mb-6">
              <span className="text-white/80 text-lg">About us</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Airbcar is the first Moroccan<br />
              mobility rental car app.
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl">
              We're making cities for people, offering better alternatives for 
              every purpose a private car serves — including 
              ride-hailing, shared cars, scooters, 
              and food and grocery delivery.
            </p>
            <button className="bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors duration-200 shadow-lg">
              Be Partner
            </button>
          </div>
          
          {/* Right side - Mobile app mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Phone frame */}
              <div className="w-80 h-[600px] bg-black rounded-[3rem] p-3 shadow-2xl">
                {/* Screen */}
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                  {/* Status bar */}
                  <div className="flex justify-between items-center px-6 py-3 text-black text-sm">
                    <span className="font-medium">9:41</span>
                    <div className="flex space-x-1">
                      <div className="w-4 h-2 bg-black rounded-sm"></div>
                      <div className="w-4 h-2 bg-black rounded-sm"></div>
                      <div className="w-4 h-2 bg-black rounded-sm"></div>
                    </div>
                  </div>
                  
                  {/* App content */}
                  <div className="px-6 py-4 space-y-3">
                    {/* Premium option */}
                    <div className="flex items-center justify-between py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-8 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                          <svg className="w-10 h-6 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M5,11L6.5,6.5H17.5L19,11H5M17.5,16A1.5,1.5 0 0,1 16,14.5A1.5,1.5 0 0,1 17.5,13A1.5,1.5 0 0,1 19,14.5A1.5,1.5 0 0,1 17.5,16M6.5,16A1.5,1.5 0 0,1 5,14.5A1.5,1.5 0 0,1 6.5,13A1.5,1.5 0 0,1 8,14.5A1.5,1.5 0 0,1 6.5,16M18.92,6C18.72,5.42 18.16,5 17.5,5H6.5C5.84,5 5.28,5.42 5.08,6L3,12V20A1,1 0 0,0 4,21H5A1,1 0 0,0 6,20V19H18V20A1,1 0 0,0 19,21H20A1,1 0 0,0 21,20V12L18.92,6Z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-gray-900 font-medium text-base">Premium</div>
                          <div className="text-gray-700 text-sm">Mid-size and luxury cars</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-900 font-bold text-lg">4.50 €</div>
                      </div>
                    </div>
                    
                    {/* Soft option */}
                    <div className="flex items-center justify-between py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-8 rounded-xl overflow-hidden bg-orange-100 flex items-center justify-center">
                          <svg className="w-10 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M5,11L6.5,6.5H17.5L19,11H5M17.5,16A1.5,1.5 0 0,1 16,14.5A1.5,1.5 0 0,1 17.5,13A1.5,1.5 0 0,1 19,14.5A1.5,1.5 0 0,1 17.5,16M6.5,16A1.5,1.5 0 0,1 5,14.5A1.5,1.5 0 0,1 6.5,13A1.5,1.5 0 0,1 8,14.5A1.5,1.5 0 0,1 6.5,16M18.92,6C18.72,5.42 18.16,5 17.5,5H6.5C5.84,5 5.28,5.42 5.08,6L3,12V20A1,1 0 0,0 4,21H5A1,1 0 0,0 6,20V19H18V20A1,1 0 0,0 19,21H20A1,1 0 0,0 21,20V12L18.92,6Z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-gray-900 font-medium text-base">Soft</div>
                          <div className="text-gray-700 text-sm">Eco and economy cars</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-900 font-bold text-lg">3.50 €</div>
                      </div>
                    </div>
                    
                    {/* Air option */}
                    <div className="flex items-center justify-between py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-8 rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center">
                          <svg className="w-10 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M5,11L6.5,6.5H17.5L19,11H5M17.5,16A1.5,1.5 0 0,1 16,14.5A1.5,1.5 0 0,1 17.5,13A1.5,1.5 0 0,1 19,14.5A1.5,1.5 0 0,1 17.5,16M6.5,16A1.5,1.5 0 0,1 5,14.5A1.5,1.5 0 0,1 6.5,13A1.5,1.5 0 0,1 8,14.5A1.5,1.5 0 0,1 6.5,16M18.92,6C18.72,5.42 18.16,5 17.5,5H6.5C5.84,5 5.28,5.42 5.08,6L3,12V20A1,1 0 0,0 4,21H5A1,1 0 0,0 6,20V19H18V20A1,1 0 0,0 19,21H20A1,1 0 0,0 21,20V12L18.92,6Z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-gray-900 font-medium text-base">Air</div>
                          <div className="text-gray-700 text-sm">Standard car</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-900 font-bold text-lg">5.25 €</div>
                      </div>
                    </div>
                    
                    {/* Premium option 2 */}
                    <div className="flex items-center justify-between py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-8 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center">
                          <svg className="w-10 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M5,11L6.5,6.5H17.5L19,11H5M17.5,16A1.5,1.5 0 0,1 16,14.5A1.5,1.5 0 0,1 17.5,13A1.5,1.5 0 0,1 19,14.5A1.5,1.5 0 0,1 17.5,16M6.5,16A1.5,1.5 0 0,1 5,14.5A1.5,1.5 0 0,1 6.5,13A1.5,1.5 0 0,1 8,14.5A1.5,1.5 0 0,1 6.5,16M18.92,6C18.72,5.42 18.16,5 17.5,5H6.5C5.84,5 5.28,5.42 5.08,6L3,12V20A1,1 0 0,0 4,21H5A1,1 0 0,0 6,20V19H18V20A1,1 0 0,0 19,21H20A1,1 0 0,0 21,20V12L18.92,6Z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-gray-900 font-medium text-base">Premium</div>
                          <div className="text-gray-700 text-sm">Mid-size and luxury cars</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-orange-600 font-bold text-lg">3.50 €</div>
                      </div>
                    </div>
                    
                    {/* Bolt Drive option - highlighted */}
                    <div className="flex items-center justify-between py-4 bg-orange-50 rounded-2xl px-4 -mx-2">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-orange-600 font-bold text-base">Bolt Drive</div>
                          <div className="text-gray-700 text-sm">13 min walk 👥 4</div>
                          <div className="text-gray-700 text-sm">VVP-556</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-orange-600 font-bold text-lg">3.50 €</div>
                      </div>
                    </div>
                    
                    {/* Scooter option */}
                    <div className="flex items-center justify-between py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                          <svg className="w-8 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7.82 18c-.4 0-.8-.16-1.06-.44L5.5 16.3c-.54-.54-.54-1.42 0-1.96l.71-.71c.39-.39 1.02-.39 1.41 0l.71.71c.54.54.54 1.42 0 1.96l-1.26 1.26c-.26.28-.66.44-1.06.44m8.36 0c.4 0 .8-.16 1.06-.44l1.26-1.26c.54-.54.54-1.42 0-1.96l-.71-.71c-.39-.39-1.02-.39-1.41 0l-.71.71c-.54.54-.54 1.42 0 1.96l1.26 1.26c.26.28.66.44 1.06.44M12 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-orange-600 font-bold text-base">Scooter</div>
                          <div className="text-gray-700 text-sm">5 min walk</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-orange-600 font-bold text-lg">3.80 €</div>
                      </div>
                    </div>
                    
                    {/* Tuk-Tuk option */}
                    <div className="flex items-center justify-between py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-8 rounded-xl bg-orange-500 flex items-center justify-center relative">
                          <svg className="w-10 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17h2c0 1.1.9 2 2 2s2-.9 2-2h6c0 1.1.9 2 2 2s2-.9 2-2h2v-5l-3-4H3v7zM3 6h8v5H3V6zm16 7.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 13.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-orange-600 font-bold text-base">Tuk-Tuk</div>
                          <div className="text-gray-700 text-sm">5 min 👥 4</div>
                          <div className="text-gray-700 text-sm">3-wheel rides</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-orange-600 font-bold text-lg">3.80 €</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements for visual appeal */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

