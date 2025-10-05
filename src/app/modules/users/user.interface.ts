export interface IUpdateUserProfile {
    firstName: string;
    lastName: string;
    gender: "Male" | "Female" | "Other";
    phone: string;
    address: {
        street: string;
        country: string;
        city: string;
        zip: string;
    };
    profileImg?: File;
}
