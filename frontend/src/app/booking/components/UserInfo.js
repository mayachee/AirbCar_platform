export default function UserInfo({ user }) {
  if (!user) return null

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h2>
      <div className="bg-white border rounded-lg p-4">
        <p className="text-gray-700">
          <span className="font-medium">Name:</span> {user.first_name} {user.last_name}
        </p>
        <p className="text-gray-700 mt-2">
          <span className="font-medium">Email:</span> {user.email}
        </p>
      </div>
    </div>
  )
}


