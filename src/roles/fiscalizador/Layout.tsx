import {
  BarChart3, Bot, Building2, ClipboardList, FileBarChart,
  LayoutDashboard, ListChecks, MessageSquareText, Settings2,
  ShieldAlert, Sparkles, UploadCloud
} from 'lucide-react';
import { RoleLayout } from '../../shared/layouts/RoleLayout';

const items = [
  { label: 'Dashboard', to: '/fiscalizador', icon: LayoutDashboard },
  { label: 'Empresas', to: '/fiscalizador/empresas', icon: Building2 },
  { label: 'Operaciones', to: '/fiscalizador/operaciones', icon: ClipboardList },
  { label: 'Obligaciones', to: '/fiscalizador/obligaciones', icon: ListChecks },
  { label: 'Evidencias', to: '/fiscalizador/evidencias', icon: UploadCloud },
  { label: 'Revisión IA', to: '/fiscalizador/revision-ia', icon: Bot },
  { label: 'Evaluaciones', to: '/fiscalizador/evaluaciones', icon: Sparkles },
  { label: 'Brechas y riesgos', to: '/fiscalizador/brechas-riesgos', icon: ShieldAlert },
  { label: 'Observaciones', to: '/fiscalizador/observaciones', icon: MessageSquareText },
  { label: 'Recomendaciones', to: '/fiscalizador/recomendaciones', icon: BarChart3 },
  { label: 'Resultados', to: '/fiscalizador/resultados', icon: FileBarChart },
  { label: 'Reportes', to: '/fiscalizador/reportes', icon: FileBarChart },
  { label: 'Configuración', to: '/fiscalizador/configuracion', icon: Settings2 },
];

export default function Layout() {
  return <RoleLayout roleLabel="Administrador Fiscalizador" items={items}/>;
}
