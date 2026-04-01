'use client';

/**
 * GoogleLoginWrapper
 * Wraps any Google login element with the same rotating gradient border
 * used in ASRLoyaltyMobile/src/components/ui/GoogleButton.tsx.
 *
 * Structure:
 *   .google-animated-btn   — clips overflow; ::before is the spinning ring
 *   .google-inner-bg       — inset 3px white/dark fill (the ring shows around it)
 *      {children}          — Google button content
 */
export function GoogleLoginWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="google-animated-btn w-full">
            <div className="google-inner-bg flex justify-center">
                {children}
            </div>
        </div>
    );
}
