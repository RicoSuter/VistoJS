export interface ISampleItem {
	id: number;
	title: string;
}

export function getItems(completed: (items: ISampleItem[]) => void ) {
	setTimeout(() => {
		completed([
			{ id: 1, title: "Item 1" },
			{ id: 2, title: "Item 2" },
			{ id: 3, title: "Item 3" }
		]);
	}, 1000);
}