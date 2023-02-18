export interface TraduccionesInterface {
    _id: string,
    key: string,
    languages: Languages[],
}

type Languages = {
    [key: string]: string
}
