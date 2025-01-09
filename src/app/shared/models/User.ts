export interface User {
    id?: string | number,
    username: string,
    email: string,
    name: {
        firstname: string,
        lastname: string
    }
}