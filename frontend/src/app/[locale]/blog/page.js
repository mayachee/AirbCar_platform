'use client';

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from 'next/link';

const blogPosts = [
  {
    id: 1,
    slug: "complete-guide-renting-car-morocco",
    title: "Complete Guide to Renting a Car in Morocco",
    excerpt: "Everything you need to know about car rentals in Morocco, from requirements to tips for driving.",
    author: "Airbcar Team",
    date: "2026-02-20",
    readTime: "8 min",
    category: "Guide",
    image: "https://airbcar.com/blog/morocco-guide.jpg",
    keywords: ["car rental", "Morocco", "travel guide"],
    content: `
# Complete Guide to Renting a Car in Morocco

Renting a car in Morocco is the best way to explore this beautiful country at your own pace. Here's everything you need to know.

## Requirements

- Valid passport or ID
- Valid driver's license (held for 2+ years)
- Credit card for deposit
- Minimum age: 21 years

## Best Times to Visit

- **Spring (March-May)**: Mild weather, fewer crowds
- **Fall (September-November)**: Pleasant temperatures
- **Avoid**: Summer (July-August) - too hot, peak season

## Popular Destinations

1. **Marrakech** - Vibrant city with medina and gardens
2. **Fez** - Ancient culture and historic sites
3. **Casablanca** - Modern city with beaches
4. **Atlas Mountains** - Hiking and scenic drives
5. **Sahara Desert** - Unique adventure

## Driving Tips

1. Drive on the right side
2. Speed limits: 120 km/h on highways, 80-100 in cities
3. Keep an international driving permit
4. Carry water and emergency supplies
5. Be cautious in night driving

## Why Choose Airbcar

- Best prices in Morocco
- Professional service
- 24/7 support
- Insurance included
- Airport pickup available

Book your car today and explore Morocco!
    `
  },
  {
    id: 2,
    slug: "best-time-visit-morocco",
    title: "Best Time to Visit Morocco: A Complete Seasonal Guide",
    excerpt: "Discover the best months to visit Morocco and what to expect weather and price-wise.",
    author: "Travel Expert",
    date: "2026-02-15",
    readTime: "6 min",
    category: "Travel Tips",
    image: "https://airbcar.com/blog/seasonal-guide.jpg",
    keywords: ["Morocco", "travel", "seasons", "weather"],
    content: `
# Best Time to Visit Morocco

## Spring (March-May)
Best season for visiting Morocco. Mild weather (15-25°C), perfect for exploring.

## Summer (June-August)
Hot and crowded. Temperatures 25-35°C. Not ideal but manageable in coastal areas.

## Fall (September-November)
Second best season. Weather cooling down, fewer tourists, excellent for driving.

## Winter (December-February)
Cold in mountains, mild in coastal areas. Some rain. Good for budget travelers.

## Recommendation
Visit in **April-May or October-November** for the best experience with Airbcar.
    `
  },
  {
    id: 3,
    slug: "driving-morocco-tips-safety",
    title: "Driving in Morocco: Essential Tips & Safety Guidelines",
    excerpt: "Important safety tips and driving guidelines for renting a car in Morocco.",
    author: "Safety Expert",
    date: "2026-02-10",
    readTime: "5 min",
    category: "Safety",
    image: "https://airbcar.com/blog/driving-tips.jpg",
    keywords: ["driving", "Morocco", "safety", "tips"],
    content: `
# Driving in Morocco: Tips & Safety

## Road Conditions
- Modern highways well-maintained (pay tolls)
- Secondary roads can be narrow
- Mountain roads require caution
- Watch for donkeys and pedestrians

## Traffic Rules
- Drive on the right
- Speed limits: 120 km/h highways, 100 km/h urban
- Seatbelts mandatory
- No phone while driving
- Stop signs required

## Important Safety Tips
1. Carry documents always
2. Have adequate insurance
3. Drive during daylight when possible
4. Stay on main roads
5. Keep emergency numbers

## Emergency Contacts
- Police: 19
- Ambulance: 15
- Fire: 16

Stay safe while exploring Morocco with Airbcar!
    `
  }
];

export const metadata = {
  title: "Airbcar Blog - Car Rental Tips & Travel Guides for Morocco",
  description: "Read expert tips on car rentals, travel guides, and driving advice for Morocco. Discover the best destinations and insider travel tips.",
  keywords: "Morocco travel blog, car rental tips, travel guides, driving advice",
  openGraph: {
    title: "Airbcar Blog - Car Rental & Travel Guides",
    description: "Expert tips on renting cars and exploring Morocco",
    type: "website",
  },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      {/* Blog Schema for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "Airbcar Blog",
            "description": "Car rental and travel guides for Morocco",
            "url": "https://airbcar.com/blog",
            "image": "https://airbcar.com/logo.png",
            "author": {
              "@type": "Organization",
              "name": "Airbcar",
              "url": "https://airbcar.com",
            },
            "blogPost": blogPosts.map(post => ({
              "@type": "BlogPosting",
              "headline": post.title,
              "description": post.excerpt,
              "image": post.image,
              "datePublished": post.date,
              "author": {
                "@type": "Person",
                "name": post.author,
              },
              "articleBody": post.content,
            })),
          })
        }}
      />

      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://airbcar.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Blog",
                "item": "https://airbcar.com/blog"
              }
            ]
          })
        }}
      />

      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Airbcar Blog
          </h1>
          <p className="text-xl text-blue-100">
            Expert tips, travel guides, and car rental advice for Morocco
          </p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article key={post.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold text-blue-600 uppercase">
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-500">{post.readTime}</span>
                </div>
                
                <h2 className="text-xl font-bold mb-2 line-clamp-2">
                  {post.title}
                </h2>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{post.author}</span>
                  <span>{new Date(post.date).toLocaleDateString()}</span>
                </div>
                
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-4 inline-block text-blue-600 font-semibold hover:text-blue-800 transition"
                >
                  Read More →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-blue-50 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-gray-600 mb-6">
            Get the latest car rental tips and Morocco travel guides delivered to your inbox.
          </p>
          <form className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
