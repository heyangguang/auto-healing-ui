import { useEffect, useState } from 'react';
import { MOBILE_BP, TABLET_BP } from './constants';

interface ResponsiveState {
    isMobile: boolean;
    isTablet: boolean;
}

const getResponsiveState = (): ResponsiveState => ({
    isMobile: typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BP : false,
    isTablet: typeof window !== 'undefined' ? window.innerWidth <= TABLET_BP : false,
});

const useResponsive = (): ResponsiveState => {
    const [state, setState] = useState<ResponsiveState>(getResponsiveState);

    useEffect(() => {
        const onResize = () => {
            setState({
                isMobile: window.innerWidth <= MOBILE_BP,
                isTablet: window.innerWidth <= TABLET_BP,
            });
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return state;
};

export default useResponsive;
