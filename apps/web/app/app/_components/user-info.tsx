import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getServerSession } from '@/lib/auth/session';
import { getGreeting, getInitials } from '@/lib/ui';

const UserInfo = async () => {
  const session = await getServerSession();

  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-12 rounded-full">
        <AvatarImage
          src={session?.user?.image ?? undefined}
          alt={session?.user?.name}
        />
        <AvatarFallback>
          {getInitials(session?.user?.name) || 'HI'}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <p className="max-w-32 text-sm wrap-normal">{`${getGreeting()}, `}</p>
        <p className="text-lg font-semibold">{session?.user?.name}</p>
      </div>
    </div>
  );
};

export default UserInfo;
