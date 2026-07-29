import { Angry, Annoyed, Smile } from "lucide-react";

export function Rating({
  value,
  className = "card-rating",
}: {
  value: number;
  className?: string;
}) {
  const isPositive = value >= 8;
  const isNeutral = value >= 5 && !isPositive;
  const percentage = Math.round(value * 10);
  const Icon = isPositive ? Smile : isNeutral ? Annoyed : Angry;

  return (
    <span
      className={`${className} score-indicator ${
        isPositive ? "score-positive" : isNeutral ? "score-neutral" : "score-low"
      }`}
      aria-label={`Avaliação de ${percentage}%`}
    >
      <span>{percentage}%</span>
      <Icon aria-hidden="true" size={19} strokeWidth={1.9} />
    </span>
  );
}
