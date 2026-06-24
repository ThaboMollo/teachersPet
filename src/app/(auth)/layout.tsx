export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F1F3D] to-[#1a3a6b] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            {/* Paw icon placeholder — replace with actual logo asset */}
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
              🐾
            </div>
            <span className="text-2xl font-bold text-white">Teacher&apos;s</span>
            <span className="text-2xl font-bold text-primary">PET</span>
          </div>
          <p className="text-sm text-white/60">Innobuntu Group</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">{children}</div>
      </div>
    </div>
  )
}
