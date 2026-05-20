import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="flex flex-col items-center gap-4 max-w-md text-center p-8">
        <h1 className="text-6xl font-black text-primary-600">404</h1>
        <p className="text-xl font-semibold text-surface-900">Page not found</p>
        <p className="text-surface-600">The page you are looking for does not exist or has been moved.</p>
        <Link
          to="/"
          className="px-6 py-2 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
