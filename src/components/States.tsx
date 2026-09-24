export function LoadingState({
  label = "Cargando información…",
}: {
  label?: string;
}) {
  return (
    <div className="loading">
      <span className="spinner" /> {label}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="alert" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button
          className="button button--small button--secondary"
          onClick={onRetry}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
