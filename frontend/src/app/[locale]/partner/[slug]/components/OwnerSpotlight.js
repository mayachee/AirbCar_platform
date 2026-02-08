'use client';

import { Star, MapPin, Calendar, Shield, CheckCircle2, Car, TrendingUp, Award, Phone, Mail, Building2 } from 'lucide-react';

export default function OwnerSpotlight({ partner }) {
  // Debug: Log partner data to see what's available
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('🔍 OwnerSpotlight - Partner Data:', {
      hasPartner: !!partner,
      partnerKeys: partner ? Object.keys(partner) : [],
      description: partner?.description,
      data: partner?.data
    })
  }

  // Handle nested data structure (response.data.data)
  const partnerData = partner?.data || partner || {}
  
  const companyName = partnerData?.business_name || partnerData?.company_name || partnerData?.companyName || partnerData?.user?.first_name || 'Partner';
  const logo = partnerData?.logo || partnerData?.logo_url || partnerData?.profile_picture || partnerData?.user?.profile_picture;
  const description = partnerData?.description || partnerData?.bio;
  const rating = partnerData?.rating || 0;
  const reviewCount = partnerData?.review_count || 0;
  const isVerified = partnerData?.is_verified || false;
  const location = partnerData?.location || partnerData?.city || partnerData?.user?.city || '';
  const memberSince = partnerData?.created_at ? new Date(partnerData.created_at).getFullYear() : null;
  const businessType = partnerData?.business_type;
  const totalBookings = partnerData?.total_bookings || 0;
  const totalEarnings = partnerData?.total_earnings || 0;
  const user = partnerData?.user;
  const phone = partnerData?.phone || partnerData?.phone_number || user?.phone_number;
  const email = partnerData?.email || user?.email;

  const handleContact = () => {
    const contactSection = document.getElementById('contact-info');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-sm border border-white/10 overflow-hidden relative group">
      {/* Cover Image */}
      <div className="h-32 sm:h-48 bg-gradient-to-r from-orange-500/20 via-blue-600/20 to-purple-600/20 relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent opacity-60"></div>
      </div>
      
      <div className="px-6 pb-6 relative">
        <div className="flex flex-col sm:flex-row items-start justify-between -mt-12 sm:-mt-16 mb-4">
           {/* Profile Picture */}
           <div className="relative mb-4 sm:mb-0">
             <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[#0F172A] bg-[#0F172A] overflow-hidden shadow-xl ring-2 ring-white/10">
                {logo ? (
                  <img
                    src={logo}
                    alt={companyName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-orange-500 text-4xl font-bold"
                  style={{ display: logo ? 'none' : 'flex' }}
                >
                  {companyName[0]?.toUpperCase() || 'P'}
                </div>
             </div>
             {isVerified && (
               <div className="absolute bottom-1 right-1 bg-[#0F172A] rounded-full p-1 ring-2 ring-[#0F172A]">
                 <CheckCircle2 className="h-6 w-6 text-green-500 fill-green-500/20" />
               </div>
             )}
           </div>
           
        </div>
        
        {/* Info */}
        <div>
           <div className="flex items-center gap-3 mb-1">
             <h1 className="text-2xl sm:text-3xl font-bold text-white">
               {companyName}
             </h1>
             {isVerified && (
                <span className="px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                  Verified
                </span>
             )}
           </div>
           
           <p className="text-gray-400 text-base mb-3 flex items-center gap-2">
             {businessType || 'Car Rental Partner'} 
             {location && (
               <>
                 <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                 <span className="text-gray-400">{location}</span>
               </>
             )}
           </p>
           
           <div className="flex flex-wrap gap-4 text-sm text-gray-500">
             {memberSince && (
               <span className="flex items-center gap-1.5">
                 <Calendar className="h-4 w-4 text-gray-400" /> 
                 Joined {memberSince}
               </span>
             )}
             {rating > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-white font-medium">{rating.toFixed(1)}</span>
                  <span className="text-gray-500">({reviewCount} reviews)</span>
                </span>
             )}
           </div>
           
           {/* Mobile Action Buttons */}
           <div className="flex sm:hidden gap-3 mt-6">
           </div>

           {/* About Section */}
           <div className="mt-8 pt-6 border-t border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">About</h2>
              {description ? (
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              ) : (
                <p className="text-gray-500 italic">
                  No description available for this partner yet.
                </p>
              )}
           </div>

           {/* Contact Information */}
           {(email || phone) && (
             <div id="contact-info" className="mt-8 pt-6 border-t border-white/10">
               <h2 className="text-xl font-bold text-white mb-4">Contact Information</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {email && (
                   <a href={`mailto:${email}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group/item">
                     <div className="p-2 rounded-full bg-orange-500/10 group-hover/item:bg-orange-500/20 transition-colors">
                       <Mail className="h-5 w-5 text-orange-500" />
                     </div>
                     <div className="flex flex-col">
                       <span className="text-xs text-gray-500 font-medium">Email Address</span>
                       <span className="text-gray-200 text-sm break-all">{email}</span>
                     </div>
                   </a>
                 )}
                 
                 {phone && (
                   <a href={`tel:${phone}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group/item">
                     <div className="p-2 rounded-full bg-orange-500/10 group-hover/item:bg-orange-500/20 transition-colors">
                       <Phone className="h-5 w-5 text-orange-500" />
                     </div>
                     <div className="flex flex-col">
                       <span className="text-xs text-gray-500 font-medium">Phone Number</span>
                       <span className="text-gray-200 text-sm">{phone}</span>
                     </div>
                   </a>
                 )}
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

