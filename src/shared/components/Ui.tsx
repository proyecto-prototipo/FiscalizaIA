import type {
  ButtonHTMLAttributes,
  ReactNode,
} from 'react';

import styles from '../styles/ui.module.css';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className={styles.pageHeader}>
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {action}
    </header>
  );
}

export function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <article className={styles.metricCard}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export function Panel({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.panel}>
      {title && <h2>{title}</h2>}
      {subtitle && <p>{subtitle}</p>}
      {children}
    </section>
  );
}

export function Badge({
  value,
}: {
  value: string;
}) {
  const key = value
    .toLowerCase()
    .replaceAll(' ', '-')
    .replaceAll('í', 'i')
    .replaceAll('ó', 'o')
    .replaceAll('é', 'e');

  return (
    <span
      className={`${styles.badge} ${
        styles[key] ?? ''
      }`}
    >
      {value}
    </span>
  );
}

export function Table({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PrimaryButton({
  children,
  type = 'button',
  className = '',
  ...buttonProps
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
}) {
  return (
    <button
      className={`${styles.primary} ${className}`}
      type={type}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  type = 'button',
  className = '',
  ...buttonProps
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
}) {
  return (
    <button
      className={`${styles.secondary} ${className}`}
      type={type}
      {...buttonProps}
    >
      {children}
    </button>
  );
}