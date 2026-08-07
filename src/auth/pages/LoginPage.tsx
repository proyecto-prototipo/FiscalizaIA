import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  ShieldCheck,
  Sparkles,
  Building2,
} from 'lucide-react';

import { useAuth } from '../../app/AuthContext';
import type { UserRole } from '../../types';
import styles from '../styles/auth.module.css';

export function LoginPage() {
  const { user, signIn, loading } = useAuth();

  const [email, setEmail] = useState('empresa@fiscalizaia.pe');
  const [password, setPassword] = useState('Demo1234');
  const [role, setRole] =
    useState<UserRole>('empresa_evaluada');
  const [error, setError] = useState('');

  if (user?.role === 'fiscalizador') {
    return <Navigate to="/fiscalizador" replace />;
  }

  if (user?.role === 'empresa_evaluada') {
    return <Navigate to="/empresa_evaluada" replace />;
  }

  function handleRoleChange(selectedRole: UserRole) {
    setRole(selectedRole);
    setError('');

    if (selectedRole === 'fiscalizador') {
      setEmail('fiscalizador@fiscalizaia.pe');
      setPassword('Demo1234');
    } else {
      setEmail('empresa@fiscalizaia.pe');
      setPassword('Demo1234');
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      await signIn(email, password, role);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo iniciar sesión',
      );
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBackground} />
        <div className={styles.heroOverlay} />
        <div className={styles.heroGrid} />

        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <ShieldCheck size={24} />
          </div>

          <div className={styles.brandText}>
            <strong>FiscalizaIA</strong>
            <span>Gestión Ambiental Minera</span>
          </div>
        </div>

        <div className={styles.heroCopy}>
          <div className={styles.heroBadge}>
            <Sparkles size={14} />
            <span>
              MineTech · Inteligencia ambiental preventiva
            </span>
          </div>

          <h1>
            Fiscalización ambiental
            <span> inteligente y trazable</span>
          </h1>

          <p>
            Centraliza obligaciones, organiza evidencias y
            detecta brechas antes de una supervisión ambiental.
          </p>

          <div className={styles.heroFeatures}>
            <div className={styles.feature}>
              <div className={styles.featureDot} />

              <div>
                <strong>Preparación preventiva</strong>
                <span>
                  Anticipa riesgos y observaciones documentales.
                </span>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureDot} />

              <div>
                <strong>Análisis asistido por IA</strong>
                <span>
                  Clasifica documentos y prioriza brechas.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.heroMetrics}>
          <article>
            <strong>76</strong>
            <span>Score de preparación</span>
          </article>

          <div className={styles.metricDivider} />

          <article>
            <strong>126</strong>
            <span>Evidencias organizadas</span>
          </article>

          <div className={styles.metricDivider} />

          <article>
            <strong>3</strong>
            <span>Brechas críticas</span>
          </article>
        </div>

        <div className={styles.heroFooter}>
          <span>
            Plataforma preventiva de gestión ambiental
          </span>

          <div className={styles.heroStatus}>
            <i />
            Sistema operativo
          </div>
        </div>
      </section>

      <section className={styles.formSide}>
        <form onSubmit={submit}>
          <span className={styles.eyebrow}>Acceso seguro</span>

          <h2>Bienvenido al centro de preparación ambiental</h2>

          <p>
            Selecciona un rol para explorar el sistema en modo
            demostración.
          </p>

          <div className={styles.roleSelector}>
            <span className={styles.roleSelectorLabel}>
              Selecciona tu rol:
            </span>

            <div className={styles.roleCards}>
              <button
                type="button"
                className={`${styles.roleCard} ${
                  role === 'fiscalizador'
                    ? styles.roleCardActive
                    : ''
                }`}
                onClick={() =>
                  handleRoleChange('fiscalizador')
                }
              >
                <div className={styles.roleCardIcon}>
                  <ShieldCheck size={20} />
                </div>

                <div className={styles.roleCardContent}>
                  <strong>Administrador Fiscalizador</strong>
                  <span>
                    Gestiona empresas, obligaciones,
                    validaciones y resultados.
                  </span>
                </div>
              </button>

              <button
                type="button"
                className={`${styles.roleCard} ${
                  role === 'empresa_evaluada'
                    ? styles.roleCardActive
                    : ''
                }`}
                onClick={() =>
                  handleRoleChange('empresa_evaluada')
                }
              >
                <div className={styles.roleCardIcon}>
                  <Building2 size={20} />
                </div>

                <div className={styles.roleCardContent}>
                  <strong>Empresa Evaluada</strong>
                  <span>
                    Carga evidencias, revisa observaciones y
                    da seguimiento a su cumplimiento.
                  </span>
                </div>
              </button>
            </div>
          </div>

          <label>
            Correo
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </label>

          <label>
            Contraseña
            <input
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              type="password"
            />
          </label>

          {error && (
            <div className={styles.error}>{error}</div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar al sistema'}
          </button>

          <small>
            Modo demostración activo. Al enlazar Supabase se
            aplicará autenticación real y RLS.
          </small>
        </form>
      </section>
    </main>
  );
}