import {
  Building2, ClipboardCheck, FileCheck2, Gauge, LayoutDashboard,
  ListChecks, MessageSquareText, ShieldAlert, UploadCloud
} from 'lucide-react';
import { RoleLayout } from '../../shared/layouts/RoleLayout';

const items = [
  { label: 'Resumen', to: '/empresa_evaluada', icon: LayoutDashboard },
  { label: 'Mi operación', to: '/empresa_evaluada/operacion', icon: Building2 },
  { label: 'Obligaciones', to: '/empresa_evaluada/obligaciones', icon: ListChecks },
  { label: 'Evidencias', to: '/empresa_evaluada/evidencias', icon: UploadCloud },
  { label: 'Estado de revisión', to: '/empresa_evaluada/revision', icon: ClipboardCheck },
  { label: 'Observaciones', to: '/empresa_evaluada/observaciones', icon: MessageSquareText },
  { label: 'Recomendaciones', to: '/empresa_evaluada/recomendaciones', icon: Gauge },
  { label: 'Brechas y riesgos', to: '/empresa_evaluada/brechas-riesgos', icon: ShieldAlert },
  { label: 'Resultado', to: '/empresa_evaluada/resultado', icon: FileCheck2 },
];

export default function Layout() {
  return <RoleLayout roleLabel="Empresa Evaluada" items={items}/>;
}
