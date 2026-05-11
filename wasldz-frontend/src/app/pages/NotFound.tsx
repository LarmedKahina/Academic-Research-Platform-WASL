import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { BookOpen } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <div className="w-24 h-24 bg-gradient-to-br from-[#f97316] to-[#fb923c] rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-6xl mb-4">404</h1>
        <h2 className="text-2xl mb-4">Page Not Found</h2>
        <p className="text-lg text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button className="bg-[#f97316] hover:bg-[#ea580c]">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};
