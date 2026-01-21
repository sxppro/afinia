'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/lib/auth/client';
import { siteConfig } from '@/lib/siteConfig';
import { Ellipsis } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import UserSettings from './user-settings';

const OptionsDropdown = () => {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button className="rounded-full" variant="outline" size="icon-xl">
            <Ellipsis className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-32" align="end">
          <DropdownMenuLabel>Options</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setShowSettings(true)}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(event) => {
              event.preventDefault();
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push(siteConfig.baseLinks.login);
                  },
                },
              });
            }}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <UserSettings open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
};

export default OptionsDropdown;
