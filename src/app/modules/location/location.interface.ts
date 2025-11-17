export interface ILocation {
    name: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ILocationWithId extends ILocation {
    _id: string;
}

export interface ICreateLocationDto {
    name: string;
}

export interface IUpdateLocationDto {
    name?: string;
    isActive?: boolean;
}
