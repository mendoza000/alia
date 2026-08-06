export type ConsentCategories = {
    necessary: true;
    analytics: boolean;
    marketing: boolean;
};

export type ConsentRecord = ConsentCategories & {
    v: number;
    ts: string;
};
