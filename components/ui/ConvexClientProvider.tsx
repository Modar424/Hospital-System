'use client'
import { ClerkProvider } from "@clerk/nextjs"

import { ConvexReactClient, Authenticated } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { useAuth } from "@clerk/nextjs";
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { useEffect } from 'react';
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);
function ConvexClientProvider({ children }: { children: React.ReactNode }) {
    return (
 <ClerkProvider  publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
 >
       <ConvexProviderWithClerk  client={convex} useAuth={useAuth}>
        <>
          <UserSync/>
            {children}
        </>
       </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
const UserSync = () => {
  const { user } = useUser();
  const createUser = useMutation(api.patients.createUser);
  useEffect(() => {
    if (user) {
      createUser({ name: user.fullName || "Unknown", email: user.emailAddresses[0].emailAddress });
    }
    }, [user, createUser]);
    return null;
  }
 
export default ConvexClientProvider
