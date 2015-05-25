export interface ISampleItem {
	id: number;
	title: string;
}

export function getItems() {
    return Q.Promise<ISampleItem[]>(resolve => {
        setTimeout(() => {
            resolve([
                { id: 1, title: "Item 1" },
                { id: 2, title: "Item 2" },
                { id: 3, title: "Item 3" }
            ]);
        }, 1000);
    });
}