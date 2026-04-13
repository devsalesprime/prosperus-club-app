export function calculateGrowthMultiplier(firstAmount: number, currentAmount: number): string {
    if (firstAmount <= 0) return "0x";
    
    const ratio = currentAmount / firstAmount;
    
    if (ratio >= 1.5) {
        return `${ratio.toFixed(1)}x`;
    }
    
    const percentage = ((currentAmount - firstAmount) / firstAmount) * 100;
    return `+${percentage.toFixed(0)}%`;
}
