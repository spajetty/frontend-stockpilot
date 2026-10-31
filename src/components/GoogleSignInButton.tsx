import { useEffect, useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';

interface GoogleSignInButtonProps {
  onCredential: (idToken: string) => void;
  onError: () => void;
}

// Google renders this button itself (an iframe), so its look is limited to Google's options.
// Its width is capped at 400px by Google, so we measure the container and stay within that.
export default function GoogleSignInButton({ onCredential, onError }: GoogleSignInButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.max(200, Math.min(400, Math.floor(el.clientWidth))));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex w-full justify-center">
      <GoogleLogin
        width={String(width)}
        size="large"
        theme="outline"
        shape="rectangular"
        text="continue_with"
        onSuccess={(res) => (res.credential ? onCredential(res.credential) : onError())}
        onError={onError}
      />
    </div>
  );
}