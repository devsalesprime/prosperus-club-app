// Video Progress Tracker Utility
// Implements 10% increment throttling for efficient database updates

export class VideoProgressTracker {
    private lastSavedProgress: number = 0;
    private readonly SAVE_THRESHOLD = 10; // Save every 10%

    /**
     * Calculate current progress percentage
     */
    calculateProgress(currentTime: number, duration: number): number {
        if (!duration || duration === 0) return 0;
        const progress = (currentTime / duration) * 100;
        return Math.min(100, Math.max(0, Math.floor(progress)));
    }

    /**
     * Determine if progress should be saved to database
     * Only returns true when crossing a 10% threshold
     */
    shouldSaveProgress(newProgress: number): boolean {
        const newThreshold = Math.floor(newProgress / this.SAVE_THRESHOLD) * this.SAVE_THRESHOLD;
        const oldThreshold = Math.floor(this.lastSavedProgress / this.SAVE_THRESHOLD) * this.SAVE_THRESHOLD;

        return newThreshold > oldThreshold;
    }

    /**
     * Round progress to nearest 10% threshold
     */
    roundToThreshold(progress: number): number {
        return Math.floor(progress / this.SAVE_THRESHOLD) * this.SAVE_THRESHOLD;
    }

    /**
     * Update last saved progress
     */
    updateLastSaved(progress: number): void {
        this.lastSavedProgress = this.roundToThreshold(progress);
    }

    /**
     * Reset tracker (for new video)
     */
    reset(): void {
        this.lastSavedProgress = 0;
    }

    /**
     * Initialize with existing progress
     */
    initialize(existingProgress: number): void {
        this.lastSavedProgress = this.roundToThreshold(existingProgress);
    }
}
