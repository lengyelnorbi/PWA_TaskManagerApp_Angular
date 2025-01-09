export interface Task {
    id?: number | string,
    userID: number | string,
    title: string,
    date: string,
    priority: string,
    isDone: boolean,
    taskGroupID: string | number | null
}