export interface IPageConfig {
    pageType: "signin" | "signup";
    title: string;
    logo?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICreatePageConfig {
    pageType: "signin" | "signup";
    title: string;
    logo?: string;
    isActive?: boolean;
}

export interface IUpdatePageConfig {
    title?: string;
    logo?: string;
    isActive?: boolean;
}
