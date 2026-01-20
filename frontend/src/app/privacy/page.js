export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose max-w-none">
        <p className="mb-4">
          At AirbCar, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
        </p>
        <p className="mb-4">
          Current as of {new Date().toLocaleDateString()}.
        </p>
        <h2 className="text-2xl font-semibold mt-6 mb-4">Information We Collect</h2>
        <p className="mb-4">
          We collect information that you validly provide to us when registering, expressing an interest in obtaining information about us or our products and services, when participating in activities on the Services, or otherwise when you contact us.
        </p>
      </div>
    </div>
  );
}
