export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-slate-900">
          Novatech Repair Suite
        </h1>

        <p className="mt-4 text-lg text-slate-600">
          Repair Shop Management System
        </p>

        <button className="mt-8 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
          Get Started
        </button>
      </div>
    </main>
  );
}