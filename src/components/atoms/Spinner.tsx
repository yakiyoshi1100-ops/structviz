interface SpinnerProps {
  size?: number
}

export function Spinner({ size = 16 }: SpinnerProps) {
  return (
    <span
      className="spinner"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
      }}
    />
  )
}
