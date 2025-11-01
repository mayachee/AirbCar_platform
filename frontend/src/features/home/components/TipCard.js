export default function TipCard({ icon, title, description, color }) {
  const IconContainer = ({ children }) => {
    const baseClasses = "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 border";
    
    switch(color) {
      case "orange":
        return <div className={`${baseClasses} bg-gradient-to-br from-orange-100 to-orange-200 border-orange-200`}>{children}</div>;
      case "blue":
        return <div className={`${baseClasses} bg-gradient-to-br from-blue-100 to-blue-200 border-blue-200`}>{children}</div>;
      case "green":
        return <div className={`${baseClasses} bg-gradient-to-br from-green-100 to-green-200 border-green-200`}>{children}</div>;
      case "purple":
        return <div className={`${baseClasses} bg-gradient-to-br from-purple-100 to-purple-200 border-purple-200`}>{children}</div>;
      case "emerald":
        return <div className={`${baseClasses} bg-gradient-to-br from-emerald-100 to-emerald-200 border-emerald-200`}>{children}</div>;
      case "indigo":
        return <div className={`${baseClasses} bg-gradient-to-br from-indigo-100 to-indigo-200 border-indigo-200`}>{children}</div>;
      default:
        return <div className={`${baseClasses} bg-gradient-to-br from-gray-100 to-gray-200 border-gray-200`}>{children}</div>;
    }
  };

  return (
    <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
        <div className="w-full h-full bg-gray-400 rounded-full transform translate-x-6 -translate-y-6 group-hover:scale-150 transition-transform duration-500"></div>
      </div>
      
      {/* Icon */}
      <div className="flex items-center justify-center mb-6">
        <IconContainer>
          <span className="text-3xl">{icon}</span>
        </IconContainer>
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-orange-600 transition-colors duration-300">
        {title}
      </h3>
      <p className="text-gray-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}










