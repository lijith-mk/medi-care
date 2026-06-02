import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleHome } from '../utils/roleRoutes';

/**
 * Renders an "or" divider + the Google Sign-In button.
 * Works on both Login and Register pages — the backend handles
 * find-or-create automatically so there's no difference in usage.
 *
 * Props:
 *   onError(msg: string)  — called with a human-readable error string
 *   loading               — current page loading state (disables button)
 *   setLoading(bool)      — page-level loading setter
 */
export default function GoogleSignInButton({ onError, loading, setLoading }) {
  const { googleAuth } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const result = await googleAuth(credentialResponse.credential);
      navigate(getRoleHome(result.data.user.role), { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        'Google sign-in failed. Please try again.';
      onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleError = () => {
    onError('Google sign-in was cancelled or failed. Please try again.');
  };

  return (
    <div className="w-full">
      {/* Divider */}
      <div className="relative flex items-center py-3">
        <div className="flex-grow border-t border-gray-200" />
        <span className="mx-3 flex-shrink text-xs text-gray-400">or</span>
        <div className="flex-grow border-t border-gray-200" />
      </div>

      {/* Google button — rendered by @react-oauth/google, styled to full width */}
      <div className={`flex justify-center ${loading ? 'pointer-events-none opacity-60' : ''}`}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap={false}
          shape="rectangular"
          size="large"
          width="360"
          text="continue_with"
          logo_alignment="left"
        />
      </div>
    </div>
  );
}
