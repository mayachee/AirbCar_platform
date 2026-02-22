import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from 'next/link';

const blogPosts = {
  "complete-guide-renting-car-morocco": {
    title: "Complete Guide to Renting a Car in Morocco",
    author: "Airbcar Team",
    date: "2026-02-20",
    readTime: "8 min",
    category: "Guide",
    image: "https://airbcar.com/blog/morocco-guide.jpg",
    excerpt: "Everything you need to know about car rentals in Morocco, from requirements to tips for driving.",
    content: `
## Complete Guide to Renting a Car in Morocco

Renting a car in Morocco is the best way to explore this beautiful country at your own pace. Here's everything you need to know.

### Requirements

- Valid passport or ID
- Valid driver's license (held for 2+ years)
- Credit card for deposit
- Minimum age: 21 years

### Best Times to Visit

- **Spring (March-May)**: Mild weather, fewer crowds
- **Fall (September-November)**: Pleasant temperatures
- **Avoid**: Summer (July-August) - too hot, peak season

### Popular Destinations

1. **Marrakech** - Vibrant city with medina and gardens
2. **Fez** - Ancient culture and historic sites
3. **Casablanca** - Modern city with beaches
4. **Atlas Mountains** - Hiking and scenic drives
5. **Sahara Desert** - Unique adventure

### Driving Tips

1. Drive on the right side
2. Speed limits: 120 km/h on highways, 80-100 in cities
3. Keep an international driving permit
4. Carry water and emergency supplies
5. Be cautious in night driving

### Why Choose Airbcar

- Best prices in Morocco
- Professional service
- 24/7 support
- Insurance included
- Airport pickup available

Book your car today and explore Morocco!
    `
  },
  "best-time-visit-morocco": {
    title: "Best Time to Visit Morocco: A Complete Seasonal Guide",
    author: "Travel Expert",
    date: "2026-02-15",
    readTime: "6 min",
    category: "Travel Tips",
    image: "https://airbcar.com/blog/seasonal-guide.jpg",
    excerpt: "Discover the best months to visit Morocco and what to expect weather and price-wise.",
    content: `
## Best Time to Visit Morocco

### Spring (March-May)
Best season for visiting Morocco. Mild weather (15-25°C), perfect for exploring.

### Summer (June-August)
Hot and crowded. Temperatures 25-35°C. Not ideal but manageable in coastal areas.

### Fall (September-November)
Second best season. Weather cooling down, fewer tourists, excellent for driving.

### Winter (December-February)
Cold in mountains, mild in coastal areas. Some rain. Good for budget travelers.

### Recommendation
Visit in **April-May or October-November** for the best experience with Airbcar.

### Pricing Tips

- High season (April-May, September-October): Book 3 weeks ahead
- Shoulder season (March, June, November): Good prices, mild weather
- Low season (July-August, December-February): Budget-friendly

### What to Pack

- Lightweight clothing for hot days
- Light jacket for cool evenings
- Sunscreen and sunglasses
- Comfortable driving shoes
- Camera and chargers
    `
  },
  "driving-morocco-tips-safety": {
    title: "Driving in Morocco: Essential Tips & Safety Guidelines",
    author: "Safety Expert",
    date: "2026-02-10",
    readTime: "5 min",
    category: "Safety",
    image: "https://airbcar.com/blog/driving-tips.jpg",
    excerpt: "Important safety tips and driving guidelines for renting a car in Morocco.",
    content: `
## Driving in Morocco: Tips & Safety

### Road Conditions
- Modern highways well-maintained (pay tolls)
- Secondary roads can be narrow
- Mountain roads require caution
- Watch for donkeys and pedestrians

### Traffic Rules
- Drive on the right
- Speed limits: 120 km/h highways, 100 km/h urban
- Seatbelts mandatory
- No phone while driving
- Stop signs required

### Important Safety Tips
1. Carry documents always
2. Have adequate insurance
3. Drive during daylight when possible
4. Stay on main roads
5. Keep emergency numbers

### Emergency Contacts
- Police: 19
- Ambulance: 15
- Fire: 16

### Fuel Tips
- Fuel is relatively cheap
- Use major fuel stations
- Unleaded fuel is standard
- Some remote areas may have limited fuel options

### Vehicle Inspection
Before driving, check:
- Tire condition
- Lights and wipers
- Mirrors
- Brakes
- Fluid levels

Stay safe while exploring Morocco with Airbcar!
    `
  }
};

export async function generateMetadata({ params }) {
  const slug = (await params).slug;
  const post = blogPosts[slug];
  
  if (!post) return {};

  return {
    title: `${post.title} | Airbcar Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      image: post.image,
      type: "article",
      publishedTime: post.date,
      author: post.author,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      image: post.image,
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(blogPosts).map(slug => ({
    slug: slug
  }));
}

export default async function BlogPostPage({ params }) {
  const slug = (await params).slug;
  const post = blogPosts[slug];

  if (!post) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-4">The blog post you're looking for doesn't exist.</p>
          <Link href="/blog" className="text-blue-600 hover:underline">
            Back to Blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const publishDate = new Date(post.date);

  return (
    <div className="min-h-screen">
      {/* Article Schema for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.excerpt,
            "image": post.image,
            "datePublished": post.date,
            "dateModified": post.date,
            "author": {
              "@type": "Person",
              "name": post.author,
            },
            "publisher": {
              "@type": "Organization",
              "name": "Airbcar",
              "logo": {
                "@type": "ImageObject",
                "url": "https://airbcar.com/logo.png",
              },
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://airbcar.com/blog/${slug}`,
            },
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
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": post.title,
                "item": `https://airbcar.com/blog/${slug}`
              }
            ]
          })
        }}
      />

      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/blog"
            className="text-blue-100 hover:text-white mb-4 inline-block"
          >
            ← Back to Blog
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {post.title}
          </h1>
          <div className="flex gap-4 text-blue-100">
            <span>{post.author}</span>
            <span>•</span>
            <span>{publishDate.toLocaleDateString()}</span>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      <img
        src={post.image}
        alt={post.title}
        className="w-full h-96 object-cover"
      />

      {/* Content */}
      <article className="max-w-4xl mx-auto py-12 px-4">
        <div className="prose prose-lg max-w-none">
          {post.content.split('\n\n').map((paragraph, idx) => {
            if (paragraph.startsWith('##')) {
              return (
                <h2 key={idx} className="text-3xl font-bold mt-8 mb-4">
                  {paragraph.replace('## ', '')}
                </h2>
              );
            }
            if (paragraph.startsWith('###')) {
              return (
                <h3 key={idx} className="text-2xl font-bold mt-6 mb-3">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('-') || paragraph.startsWith('1.')) {
              return (
                <ul key={idx} className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                  {paragraph.split('\n').map((item, i) => (
                    <li key={i} className="text-gray-700">
                      {item.replace(/^[-1-9.]\s*/, '')}
                    </li>
                  ))}
                </ul>
              );
            }
            return paragraph && (
              <p key={idx} className="text-gray-700 leading-relaxed mb-4">
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* Post Meta */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-gray-600">
            <span className="font-semibold">Category:</span> {post.category}
          </p>
        </div>
      </article>

      {/* Related Articles */}
      <section className="bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(blogPosts)
              .filter(([key]) => key !== slug)
              .map(([key, relatedPost]) => (
                <Link
                  key={key}
                  href={`/blog/${key}`}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
                >
                  <img
                    src={relatedPost.image}
                    alt={relatedPost.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-2 line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {relatedPost.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Explore Morocco?
          </h2>
          <p className="text-xl text-blue-100 mb-6">
            Book your rental car with Airbcar today.
          </p>
          <Link
            href="/search"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition"
          >
            Book Now
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
