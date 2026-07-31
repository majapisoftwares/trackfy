import { Angry, Annoyed, Smile, Star } from "lucide-react";

export function Rating({
  value,
  className = "card-rating",
  icon = "status",
}: {
  value: number;
  className?: string;
  icon?: "status" | "star";
}) {
  const isPositive = value >= 8;
  const isNeutral = value >= 5 && !isPositive;
  const percentage = Math.round(value * 10);
  const StatusIcon = isPositive ? Smile : isNeutral ? Annoyed : Angry;

  return (
    <span
      className={`${className} score-indicator ${
        isPositive ? "score-positive" : isNeutral ? "score-neutral" : "score-low"
      }`}
      aria-label={`Avaliação de ${percentage}%`}
    >
      <span>{percentage}%</span>
      {icon === "star" ? (
        <Star className="score-icon" aria-hidden="true" size={16} strokeWidth={2.2} />
      ) : (
        <StatusIcon aria-hidden="true" size={19} strokeWidth={1.9} />
      )}
    </span>
  );
}
