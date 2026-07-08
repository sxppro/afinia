'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { authClient } from '@/lib/auth/client';
import { siteConfig } from '@/lib/siteConfig';
import { cn } from '@/lib/ui';
import { APIError } from 'better-auth';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';

const LoginForm = ({ className, ...props }: React.ComponentProps<'div'>) => {
  const [isLoading, setIsLoading] = useState(false);
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: siteConfig.baseLinks.appHome,
        errorCallbackURL: siteConfig.baseLinks.loginError,
      });
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      if (error instanceof APIError) {
        console.error(error.message, error.status);
      }
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="gap-4">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldSet>
            <FieldGroup>
              <Field>
                <Button
                  type="button"
                  className="border-none shadow-xs transition"
                  onClick={signInWithGoogle}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    'Sign in with Google'
                  )}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                OR
              </FieldSeparator>
              <Field>
                <Button variant="outline" type="button">
                  Continue as guest
                </Button>
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{' '}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
};

export default LoginForm;
