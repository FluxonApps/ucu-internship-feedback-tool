type ScoreCircleProps = {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
};

export function ScoreCircle({
  value,
  max = 5,
  size = 120,
  strokeWidth = 12,
}: ScoreCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(value, max)) / max;
  const offset = circumference * (1 - progress);
  const isSmall = size < 50;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgb(219 234 254)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgb(59 130 246)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-in-out"
        />
      </svg>

      <div className="absolute flex flex-col items-center justify-center">
        <span className={`${isSmall ? "text-xs" : "text-2xl"} font-bold text-foreground`}>
          {value.toFixed(1)}
          {!isSmall && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              / {max}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
