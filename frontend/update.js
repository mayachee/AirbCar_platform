const fs = require('fs');
const file = 'src/app/[locale]/partner/fleet-sharing/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

content = content.replace(
  'import { Search, Filter, MapPin, Calendar, Star, ChevronRight, Car } from "lucide-react";',
  'import { Search, Filter, MapPin, Calendar, Star, ChevronRight, Car, Loader2 } from "lucide-react";\nimport { vehicleService } from "@/features/vehicle/services/vehicleService";\nimport type { Vehicle } from "@/types";'
);

content = content.replace(
  'import React, { useState } from "react";',
  'import React, { useState, useEffect } from "react";'
);

content = content.replace(/\/\/ Mock data for the fleet marketplace.*?\n\];/s, '');

content = content.replace(
  'const CATEGORIES = ["All", "Electric", "SUV", "Luxury", "Sports", "Economy"];',
  'const CATEGORIES = ["All", "Electric", "SUV", "Sedan", "Coupe", "Convertible", "Truck", "Standard"];'
);

const hookLogic = \  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const res = await vehicleService.getVehicles();
        const fetchedData = res?.data?.results || res?.data?.data || res?.data || res;
        setVehicles(Array.isArray(fetchedData) ? fetchedData : []);
      } catch (err) {
        console.error("Error fetching vehicles:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const filteredInventory = vehicles.filter((car: any) => {
    const make = car.brand || car.make || "";
    const partnerName = car.partner?.businessName || car.partner?.user?.first_name || "Unknown Partner";
    const searchString = make + " " + (car.model || "") + " " + partnerName;
    const matchesSearch = searchString.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = selectedCategory === "All" 
      || (car.fuelType?.toLowerCase() === selectedCategory.toLowerCase()) 
      || (car.style?.toLowerCase() === selectedCategory.toLowerCase());
    
    return matchesSearch && matchesCategory;
  });\;

content = content.replace(/  const filteredInventory = INVENTORY_DATA\.filter.*?\}\);/s, hookLogic);

content = content.replace(/car\.make/g, '(car.brand || car.make)');
content = content.replace(/car\.category/g, '(car.style || car.fuelType || "Standard")');
content = content.replace(/car\.partnerName/g, '(car.partner?.businessName || car.partner?.user?.firstName || "Unknown Partner")');
content = content.replace(/car\.trips/g, '(car.totalBookings || 0)');
content = content.replace(/car\.image/g, '(car.images?.[0] || "https://placehold.co/800x600/1a1a1a/FFF?text=No+Image")');
content = content.replace(/car\.price/g, '(car.dailyRate || car.price_per_day || 0)');
content = content.replace(/car\.rating/g, '(car.rating || 5.0)');
content = content.replace(/car\.available/g, 'car.isAvailable');

content = content.replace(
  '{/* Dynamic Inventory Grid */}',
  \{/* Dynamic Inventory Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-[#F97316] animate-spin mb-4" />
            <p className="text-neutral-400">Loading marketplace inventory...</p>
          </div>
        ) : (\
);

content = content.replace(
  '          </AnimatePresence>\\n        </div>',
  '          </AnimatePresence>\\n        </div>\\n        )}'
);

content = content.replace(
  '{filteredInventory.length === 0 && (',
  '{!loading && filteredInventory.length === 0 && ('
);

fs.writeFileSync(file, content, 'utf-8');
console.log('Update fleet sharing complete.');
