import React from 'react';

// Importar ícones do Lucide React
import {
  Sun,
  Moon,
  LogOut,
  PenTool,
  BarChart3,
  Brain,
  Trophy,
  X,
  Info,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Rocket,
  CheckCircle,
  BookOpen,
  ThumbsUp,
  Target,
  FileText,
  Bot,
  Book,
  XCircle,
  RotateCcw,
  Eye,
  Star,
  LineChart,
  BarChart,
  Users,
  Award,
  Zap,
  Activity,
  ChevronDown,
  Menu,
  Home,
  LogIn,
  User,
  Camera,
  Check,
  Edit,
  Crown,
  Calendar,
  Settings,
  Plus,
  Lock,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Image,
  Download,
  Trash,
  Shield,
  Bell,
  Gift,
  Wifi,
  WifiOff,
  AlertTriangle,
  Clock,
} from 'lucide-react';

// Mapeamento de tipos para componentes
const iconMap = {
  sun: Sun,
  moon: Moon,
  logout: LogOut,
  pen: PenTool,
  chart: BarChart3,
  brain: Brain,
  trophy: Trophy,
  close: X,
  info: Info,
  lightbulb: Lightbulb,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  rocket: Rocket,
  'check-circle': CheckCircle,
  'book-open': BookOpen,
  'thumbs-up': ThumbsUp,
  target: Target,
  'file-text': FileText,
  bot: Bot,
  book: Book,
  'x-circle': XCircle,
  'rotate-ccw': RotateCcw,
  eye: Eye,
  star: Star,
  'line-chart': LineChart,
  'bar-chart': BarChart,
  users: Users,
  award: Award,
  zap: Zap,
  activity: Activity,
  'chevron-down': ChevronDown,
  menu: Menu,
  home: Home,
  login: LogIn,
  user: User,
  x: X,
  camera: Camera,
  check: Check,
  edit: Edit,
  crown: Crown,
  calendar: Calendar,
  settings: Settings,
  'log-out': LogOut,
  plus: Plus,
  lock: Lock,
  'alert-circle': AlertCircle,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  image: Image,
  download: Download,
  trash: Trash,
  shield: Shield,
  bell: Bell,
  gift: Gift,
  wifi: Wifi,
  'wifi-off': WifiOff,
  'alert-triangle': AlertTriangle,
  clock: Clock,
  warning: AlertTriangle,
};

// Componente SmartIcon
export const SmartIcon = ({
  type,
  size = 24,
  color = 'currentColor',
  className = '',
  ...props
}) => {
  const IconComponent = iconMap[type];

  if (!IconComponent) {
    console.warn(`Ícone "${type}" não encontrado no mapeamento`);
    return null;
  }

  return (
    <IconComponent size={size} color={color} className={className} {...props} />
  );
};

// Hook para verificar disponibilidade do Lucide
export const useLucideAvailable = () => {
  return true; // Lucide está sempre disponível se instalado
};

export default SmartIcon;
