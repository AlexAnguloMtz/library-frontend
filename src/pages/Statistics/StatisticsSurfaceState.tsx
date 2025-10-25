export enum StatisticsSurfaceStatus {
    IDLE,
    LOADING,
    READY,
    ERROR,
}

export type StatisticsSurfaceState<T> =
    | { status: StatisticsSurfaceStatus.LOADING }
    | { status: StatisticsSurfaceStatus.READY; data: T[] }
    | { status: StatisticsSurfaceStatus.ERROR; error: string };
