/**
 * Index route - redirects to login
 */

import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { restoreWallet } from '@/lib/lazorkit';

export default function Index() {
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);

  useEffect(() => {
    checkWallet();
  }, []);

  async function checkWallet() {
    const wallet = await restoreWallet();
    setHasWallet(wallet !== null);
  }

  if (hasWallet === null) {
    return null; // Loading
  }

  return <Redirect href={hasWallet ? '/events' : '/login'} />;
}
