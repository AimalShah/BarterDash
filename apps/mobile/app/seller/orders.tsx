import { router } from 'expo-router';
import { useEffect } from 'react';

export default function OrdersRedirect() {
    useEffect(() => {
        router.replace('/seller/sales');
    }, []);

    return null;
}
