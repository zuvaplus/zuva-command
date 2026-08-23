export default function ComingSoon({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-3xl font-extrabold text-white">{title}</h1>
      <p className="max-w-md text-sm" style={{ color: '#F37B0D' }}>
        {message}
      </p>
    </div>
  )
}
