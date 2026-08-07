import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../auth/pages/LoginPage';
import { ProtectedRoute } from './ProtectedRoute';

import FiscalizadorLayout from '../roles/fiscalizador/Layout';
import FiscalizadorDashboardPage from '../roles/fiscalizador/dashboard/FiscalizadorDashboardPage';
import CompaniesPage from '../roles/fiscalizador/empresas/CompaniesPage';
import OperationsPage from '../roles/fiscalizador/operaciones/OperationsPage';
import ObligationsPage from '../roles/fiscalizador/obligaciones/ObligationsPage';
import EvidencesPage from "../roles/fiscalizador/evidencias/EvidencesPage";
import AIReviewPage from '../roles/fiscalizador/revision-ia/AIReviewPage';
import EvaluationsPage from '../roles/fiscalizador/evaluaciones/EvaluationsPage';
import GapsRisksPage from '../roles/fiscalizador/brechas-riesgos/GapsRisksPage';
import ObservationsPage from '../roles/fiscalizador/observaciones/ObservationsPage';
import RecommendationsPage from '../roles/fiscalizador/recomendaciones/RecommendationsPage';
import ResultsPage from '../roles/fiscalizador/resultados/ResultsPage';
import ReportsPage from '../roles/fiscalizador/reportes/ReportsPage';
import ConfigurationPage from '../roles/fiscalizador/configuracion/ConfigurationPage';

import CompanyLayout from '../roles/empresa-evaluada/Layout';
import CompanyDashboardPage from '../roles/empresa-evaluada/dashboard/CompanyDashboardPage';
import OperationPage from '../roles/empresa-evaluada/operacion/OperationPage';
import MyObligationsPage from '../roles/empresa-evaluada/obligaciones/MyObligationsPage';
import MyEvidencesPage from '../roles/empresa-evaluada/evidencias/MyEvidencesPage';
import ReviewStatusPage from '../roles/empresa-evaluada/revision/ReviewStatusPage';
import MyObservationsPage from '../roles/empresa-evaluada/observaciones/MyObservationsPage';
import MyRecommendationsPage from '../roles/empresa-evaluada/recomendaciones/MyRecommendationsPage';
import MyGapsRisksPage from '../roles/empresa-evaluada/brechas-riesgos/MyGapsRisksPage';
import MyResultPage from '../roles/empresa-evaluada/resultado/MyResultPage';

export const router = createBrowserRouter([
  { path: '/', element: <LoginPage/> },
  {
    path: '/fiscalizador',
    element: <ProtectedRoute allowedRole="fiscalizador"><FiscalizadorLayout/></ProtectedRoute>,
    children: [
      { index: true, element: <FiscalizadorDashboardPage/> },
      { path: 'empresas', element: <CompaniesPage/> },
      { path: 'operaciones', element: <OperationsPage/> },
      { path: 'obligaciones', element: <ObligationsPage/> },
      { path: 'evidencias', element: <EvidencesPage/> },
      { path: 'revision-ia', element: <AIReviewPage/> },
      { path: 'evaluaciones', element: <EvaluationsPage/> },
      { path: 'brechas-riesgos', element: <GapsRisksPage/> },
      { path: 'observaciones', element: <ObservationsPage/> },
      { path: 'recomendaciones', element: <RecommendationsPage/> },
      { path: 'resultados', element: <ResultsPage/> },
      { path: 'reportes', element: <ReportsPage/> },
      { path: 'configuracion', element: <ConfigurationPage/> },
    ],
  },
  {
    path: '/empresa_evaluada',
    element: <ProtectedRoute allowedRole="empresa_evaluada"><CompanyLayout/></ProtectedRoute>,
    children: [
      { index: true, element: <CompanyDashboardPage/> },
      { path: 'operacion', element: <OperationPage/> },
      { path: 'obligaciones', element: <MyObligationsPage/> },
      { path: 'evidencias', element: <MyEvidencesPage/> },
      { path: 'revision', element: <ReviewStatusPage/> },
      { path: 'observaciones', element: <MyObservationsPage/> },
      { path: 'recomendaciones', element: <MyRecommendationsPage/> },
      { path: 'brechas-riesgos', element: <MyGapsRisksPage/> },
      { path: 'resultado', element: <MyResultPage/> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace/> },
]);
