import { organizationConfig } from "@/lib/seoConfig";

export const metadata = {
  title: `${organizationConfig.ceo.name} - CEO of Airbcar`,
  description: `Meet ${organizationConfig.ceo.name}, CEO of Airbcar - Leading Morocco's car rental innovation and excellence. Learn about his vision for the company.`,
  openGraph: {
    title: `${organizationConfig.ceo.name} - CEO of Airbcar`,
    description: `Meet ${organizationConfig.ceo.name}, CEO of Airbcar - Leading Morocco's car rental innovation and excellence.`,
    type: "profile",
    image: organizationConfig.ceo.image,
  },
};

export default function CEOPage() {
  const { ceo, organization } = organizationConfig;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* CEO Header */}
        <div className="bg-white rounded-none shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-40"></div>
          
          <div className="relative px-6 pb-6">
            {/* CEO Photo */}
            <div className="flex flex-col sm:flex-row gap-6 -mt-24 relative z-10">
              <img
                src={ceo.image}
                alt={ceo.name}
                className="w-48 h-48 rounded-none shadow-lg object-cover border-4 border-white"
              />
              
              <div className="flex-1 pt-12 sm:pt-6">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{ceo.name}</h1>
                <h2 className="text-2xl text-blue-600 font-semibold mb-4">{ceo.title}</h2>
                <p className="text-gray-600 text-lg mb-4">{ceo.bio}</p>
                
                {/* Contact Links */}
                <div className="flex flex-wrap gap-4 mt-6">
                  {ceo.email && (
                    <a
                      href={`mailto:${ceo.email}`}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-none hover:bg-blue-700 transition"
                    >
                      Email: {ceo.email}
                    </a>
                  )}
                  {ceo.linkedInURL && (
                    <a
                      href={ceo.linkedInURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-none hover:bg-blue-800 transition"
                    >
                      LinkedIn Profile
                    </a>
                  )}
                  {ceo.twitterURL && (
                    <a
                      href={ceo.twitterURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-none hover:bg-sky-600 transition"
                    >
                      Twitter
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-none shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">About {organization.name}</h3>
            <p className="text-gray-600 leading-relaxed">{organization.description}</p>
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="font-semibold">Founded:</span> {organization.foundingDate}</p>
              <p><span className="font-semibold">Location:</span> {organization.foundingLocation}</p>
              <p><span className="font-semibold">Service Area:</span> {organization.areaServed}</p>
            </div>
          </div>

          <div className="bg-white rounded-none shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Get in Touch</h3>
            <div className="space-y-3">
              <p className="text-gray-600">
                <span className="font-semibold">Website:</span>
                <br />
                <a href={organization.url} className="text-blue-600 hover:underline">
                  {organization.url}
                </a>
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Email:</span>
                <br />
                <a href="mailto:support@airbcar.com" className="text-blue-600 hover:underline">
                  support@airbcar.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": ceo.name,
              "title": ceo.title,
              "image": ceo.image,
              "description": ceo.bio,
              "email": `mailto:${ceo.email}`,
              "telephone": ceo.phone,
              "url": `${organization.url}/ceo`,
              "sameAs": [ceo.linkedInURL, ceo.twitterURL].filter(Boolean),
              "worksFor": {
                "@type": "Organization",
                "name": organization.name,
                "url": organization.url,
              },
            }),
          }}
        />
      </div>
    </main>
  );
}
