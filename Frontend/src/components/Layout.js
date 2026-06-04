import { Outlet } from 'react-router-dom';
import Footer from './Footer';

/**
 * Simple layout wrapper that adds the footer below all page content.
 * Pages are responsible for their own headers/navigation.
 */
export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content area - grows to fill space */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* Footer - always at bottom */}
      <Footer />
    </div>
  );
}
