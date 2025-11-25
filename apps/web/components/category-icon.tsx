import { cn } from '@/lib/ui';
import {
  Apple,
  Baby,
  Banana,
  Bike,
  BottleWine,
  Car,
  CarTaxiFront,
  ChartNoAxesCombined,
  Cigarette,
  CircleQuestionMark,
  Coins,
  DoorClosedLocked,
  Dumbbell,
  FerrisWheel,
  Flame,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  Hamburger,
  Handbag,
  HandCoins,
  HouseHeart,
  Laptop,
  ListCheck,
  Martini,
  Newspaper,
  PaintRoller,
  ParkingSquare,
  PartyPopper,
  PawPrint,
  Plane,
  Shirt,
  Smartphone,
  Stethoscope,
  Tickets,
  ToolCase,
  TrainFront,
  Tv,
  User,
  UtensilsCrossed,
  WashingMachine,
  Wifi,
} from 'lucide-react';
import { createElement } from 'react';

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'good-life':
      return PartyPopper;
    case 'personal':
      return User;
    case 'home':
      return HouseHeart;
    case 'transport':
      return Car;
    case 'adult':
      return Banana;
    case 'booze':
      return BottleWine;
    case 'car-insurance-and-maintenance':
      return ToolCase;
    case 'car-repayments':
      return HandCoins;
    case 'clothing-and-accessories':
      return Shirt;
    case 'cycling':
      return Bike;
    case 'education-and-student-loans':
      return GraduationCap;
    case 'events-and-gigs':
      return Tickets;
    case 'family':
      return Baby;
    case 'fitness-and-wellbeing':
      return Dumbbell;
    case 'fuel':
      return Fuel;
    case 'games-and-software':
      return Gamepad2;
    case 'gifts-and-charity':
      return Gift;
    case 'groceries':
      return Apple;
    case 'hair-and-beauty':
      return Handbag;
    case 'health-and-medical':
      return Stethoscope;
    case 'hobbies':
      return FerrisWheel;
    case 'holidays-and-travel':
      return Plane;
    case 'home-insurance-and-rates':
      return DoorClosedLocked;
    case 'home-maintenance-and-improvements':
      return PaintRoller;
    case 'homeware-and-appliances':
      return WashingMachine;
    case 'internet':
      return Wifi;
    case 'investments':
      return ChartNoAxesCombined;
    case 'life-admin':
      return ListCheck;
    case 'lottery-and-gambling':
      return Coins;
    case 'mobile-phone':
      return Smartphone;
    case 'news-magazines-and-books':
      return Newspaper;
    case 'parking':
      return ParkingSquare;
    case 'pets':
      return PawPrint;
    case 'public-transport':
      return TrainFront;
    case 'pubs-and-bars':
      return Martini;
    case 'rent-and-mortgage':
      return HandCoins;
    case 'restaurants-and-cafes':
      return UtensilsCrossed;
    case 'takeaway':
      return Hamburger;
    case 'taxis-and-share-cars':
      return CarTaxiFront;
    case 'technology':
      return Laptop;
    case 'tobacco-and-vaping':
      return Cigarette;
    case 'toll-roads':
      return Car;
    case 'tv-and-music':
      return Tv;
    case 'utilities':
      return Flame;
    default:
      return CircleQuestionMark;
  }
};

const CategoryIcon = ({
  category,
  className,
}: {
  category: string;
  className?: string;
}) => {
  const icon = getCategoryIcon(category);
  return createElement(icon, { className: cn('size-6', className) });
};

export default CategoryIcon;
