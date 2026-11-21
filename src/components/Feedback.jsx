export function Loading({ label = "Memuat data..." }) {
  return (
    <div className="feedback" role="status">
      <span className="loader" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="feedback feedback-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button className="button button-outline" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </div>
  );
}
