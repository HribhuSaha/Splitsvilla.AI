export function formatTimeRemaining(deadlineStr: string | null | undefined): string | null {
  if (!deadlineStr) return null;
  const deadline = new Date(deadlineStr).getTime();
  const now = Date.now();
  const diff = deadline - now;
  
  if (diff <= 0) return "Expired";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
}
